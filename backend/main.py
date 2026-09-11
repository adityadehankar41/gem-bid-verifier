import logging
from typing import Any, Dict
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas.verification_schema import VerificationRequest, VerificationResponse
from services.ocr_adapter import OCRAdapter
from services.verification_orchestrator import VerificationOrchestrator

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("gem_bid_verifier.api")

app = FastAPI(
    title="GeM Bid Verifier API",
    description="FastAPI orchestration service connecting OCR document outputs, existing verifier pipeline, and React frontend.",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during local dev (including localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service instances
ocr_adapter = OCRAdapter()
orchestrator = VerificationOrchestrator()


@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Health check endpoint returning service status, OCR outputs path, and mock DB availability.
    """
    return {
        "status": "ok",
        "service": "gem-bid-verifier-backend",
        "ocr_outputs_dir": str(ocr_adapter.outputs_dir),
        "ocr_outputs_found": ocr_adapter.outputs_dir.exists(),
        "mock_dbs_loaded": {
            "pan": len(orchestrator.mock_pan_db),
            "udyam": len(orchestrator.mock_udyam_db),
            "gst": len(orchestrator.mock_gst_db),
            "blacklist": len(orchestrator.mock_blacklist_db),
        },
    }


def execute_verification(payload: VerificationRequest) -> Dict[str, Any]:
    """
    Core verification execution logic shared by /api/verification/run and /api/verify-documents.
    Reads OCR outputs, extracts document records, calls existing verifiers and aggregator.
    """
    try:
        bidder_fallback = {
            "bidderId": payload.bidderId,
            "bidderName": payload.bidderName,
            "pan": payload.pan,
            "gstin": payload.gstin,
            "udyam": payload.udyam,
        }

        # 1. Read OCR outputs
        extracted_pan = ocr_adapter.get_pan_data(bidder_fallback)
        extracted_udyam = ocr_adapter.get_udyam_data(bidder_fallback)
        extracted_gst = ocr_adapter.get_gst_data(bidder_fallback)
        blacklist_input = ocr_adapter.get_blacklist_input(
            extracted_pan, extracted_gst, extracted_udyam, bidder_fallback
        )
        audit_records = ocr_adapter.get_additional_audit_records()

        logger.info(
            "Running verification for bidder '%s' (PAN source: %s, Udyam source: %s, GST source: %s)",
            payload.bidderName or payload.bidderId or "Unknown",
            extracted_pan.get("source"),
            extracted_udyam.get("source"),
            extracted_gst.get("source"),
        )

        # 2. Run existing verifiers + aggregator
        result = orchestrator.run_verification(
            extracted_pan=extracted_pan,
            extracted_udyam=extracted_udyam,
            extracted_gst=extracted_gst,
            blacklist_input=blacklist_input,
            audit_records=audit_records,
            bidder_meta=bidder_fallback,
        )

        return result

    except Exception as exc:
        logger.error("Verification execution failed: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification pipeline failed: {str(exc)}",
        )


@app.post("/api/verification/run", response_model=VerificationResponse, tags=["Verification"])
def run_verification(payload: VerificationRequest):
    """
    Primary verification endpoint:
    1. Receives verification request.
    2. Reads and parses OCR output JSONs from Verification_pipline/ocr/outputs/.
    3. Passes extracted data to existing verifiers.
    4. Runs existing aggregator and blacklist verifier.
    5. Returns standardized response for both prompt specification and frontend.
    """
    return execute_verification(payload)


@app.post("/api/verify-documents", response_model=VerificationResponse, tags=["Verification"])
def verify_documents_alias(payload: VerificationRequest):
    """
    Backward-compatible alias for existing frontend components.
    """
    return execute_verification(payload)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

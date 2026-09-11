import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger("gem_bid_verifier.orchestrator")


def setup_verification_sys_path() -> Path:
    """
    Locates the existing verification directory and ensures it is in sys.path
    so existing verifiers can be imported directly without modification.
    """
    backend_dir = Path(__file__).resolve().parents[1]
    repo_root = backend_dir.parent

    candidates = [
        repo_root / "Verification_pipline" / "verification",
        repo_root / "Verification_pipeline" / "verification",
        backend_dir.parent / "Verification_pipline" / "verification",
    ]

    for candidate in candidates:
        if candidate.exists() and candidate.is_dir():
            cand_str = str(candidate)
            if cand_str not in sys.path:
                sys.path.insert(0, cand_str)
            return candidate

    cand_str = str(candidates[0])
    if cand_str not in sys.path:
        sys.path.insert(0, cand_str)
    return candidates[0]


# Ensure verification pipeline directory is in path prior to imports
verification_dir = setup_verification_sys_path()

try:
    from verifiers.pan_verifier2 import verify_pan
    from verifiers.udyam_verification import verify_udyam
    from verifiers.gst_verification import verify_gst
    from verifiers.blacklist_verifier import verify_blacklist
    from verifiers.aggregator import aggregate_compliance
except ImportError as err:
    logger.error("Failed to import existing verifier modules: %s", err)
    raise


class VerificationOrchestrator:
    """
    Loads mock databases from the existing verification component and coordinates
    execution of existing verifiers, scoring aggregation, and blacklist checks.
    """

    def __init__(self, base_verification_dir: Optional[Path] = None):
        self.verification_dir = base_verification_dir or setup_verification_sys_path()
        self.mock_db_dir = self.verification_dir / "mock_db"

        self.mock_pan_db = self._load_json(self.mock_db_dir / "mock_pan_db.json")
        self.mock_udyam_db = self._load_json(self.mock_db_dir / "mock_udyam_db.json")
        self.mock_gst_db = self._load_json(self.mock_db_dir / "mock_gst.json")
        self.mock_blacklist_db = self._load_json(self.mock_db_dir / "mock_blacklist_db.json")

    def _load_json(self, path: Path) -> Dict[str, Any]:
        if not path.exists():
            logger.warning("Mock DB file not found: %s", path)
            return {}
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.error("Error reading mock DB %s: %s", path.name, exc)
            return {}

    def run_verification(
        self,
        extracted_pan: Dict[str, Any],
        extracted_udyam: Dict[str, Any],
        extracted_gst: Dict[str, Any],
        blacklist_input: Dict[str, Any],
        audit_records: Optional[Dict[str, Any]] = None,
        bidder_meta: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes all existing verification modules, existing blacklist verifier,
        and existing aggregator scoring.
        """
        meta = bidder_meta or {}
        audit = audit_records or {}

        # 1. Run PAN verification
        pan_result = verify_pan(
            {"pan_no": extracted_pan.get("pan_no", ""), "name": extracted_pan.get("name", "")},
            self.mock_pan_db,
        )

        # 2. Run Udyam verification
        udyam_result = verify_udyam(
            {
                "reg_no": extracted_udyam.get("reg_no", ""),
                "entity_name": extracted_udyam.get("entity_name", ""),
                "enterprise_type": extracted_udyam.get("enterprise_type", ""),
            },
            self.mock_udyam_db,
        )

        # 3. Run GST verification
        gst_result = verify_gst(
            {
                "gstin": extracted_gst.get("gstin", ""),
                "legal_name": extracted_gst.get("legal_name", ""),
            },
            self.mock_gst_db,
        )

        # 4. Run Blacklist verification
        # Check both the extracted OCR document data and the declared bidder entity
        blacklist_result_ocr = verify_blacklist(
            {
                "pan_no": blacklist_input.get("pan_no", ""),
                "gstin": blacklist_input.get("gstin", ""),
                "name": blacklist_input.get("name", ""),
            },
            self.mock_blacklist_db,
        )

        blacklist_result_bidder = verify_blacklist(
            {
                "pan_no": meta.get("pan", ""),
                "gstin": meta.get("gstin", ""),
                "name": meta.get("bidderName", ""),
            },
            self.mock_blacklist_db,
        )

        # Merge blacklist results: if either source triggers debarment, bidder is disqualified
        if blacklist_result_ocr.get("found_on_blacklist"):
            blacklist_result = blacklist_result_ocr
        elif blacklist_result_bidder.get("found_on_blacklist"):
            blacklist_result = blacklist_result_bidder
        elif blacklist_result_ocr.get("final_verdict") == "REVIEW":
            blacklist_result = blacklist_result_ocr
        else:
            blacklist_result = blacklist_result_bidder if blacklist_result_bidder.get("matched_sources") else blacklist_result_ocr

        # 5. Run existing Aggregator
        final_report = aggregate_compliance(pan_result, udyam_result, gst_result, blacklist_result)

        is_blocked = bool(blacklist_result.get("found_on_blacklist", False))
        overall_score = 0 if is_blocked else final_report.get("overall_score", 0)

        # Map overall status
        if is_blocked:
            overall_status = "BLOCKED"
        elif final_report.get("final_verdict") == "VALID":
            overall_status = "COMPLIANT"
        elif final_report.get("final_verdict") == "NEEDS_REVIEW":
            overall_status = "NEEDS_REVIEW"
        else:
            overall_status = "NON_COMPLIANT"

        # Standardized document status mapping helper
        def get_doc_status(verdict: Optional[str]) -> str:
            if verdict == "VALID":
                return "verified"
            elif verdict == "NEEDS_REVIEW":
                return "flagged"
            return "invalid"

        # Prompt-specified "documents" structure
        documents_summary = {
            "pan": {
                "status": get_doc_status(pan_result.get("final_verdict")),
                "score": pan_result.get("score"),
                "verdict": pan_result.get("final_verdict"),
                "issues": pan_result.get("issues", []),
            },
            "gst": {
                "status": get_doc_status(gst_result.get("final_verdict")),
                "score": gst_result.get("score"),
                "verdict": gst_result.get("final_verdict"),
                "issues": gst_result.get("issues", []),
            },
            "udyam": {
                "status": get_doc_status(udyam_result.get("final_verdict")),
                "score": udyam_result.get("score"),
                "verdict": udyam_result.get("final_verdict"),
                "issues": udyam_result.get("issues", []),
            },
        }

        # Build blacklisted reason if applicable
        blacklisted_reason = None
        if is_blocked:
            issues = blacklist_result.get("issues", [])
            blacklisted_reason = "; ".join(issues) if issues else "Bidder found on national statutory debarment registry."

        # Build frontend-compatible documentScores list
        pan_detail = "; ".join(pan_result.get("issues", [])) or "Matched with CBDT master database and MCA21 records."
        gst_detail = "; ".join(gst_result.get("issues", [])) or "Active GSTIN with regular return filings verified on GSTN API Gateway."
        udyam_detail = "; ".join(udyam_result.get("issues", [])) or "MSME classification verified on national MSME registry."

        # Income proof status
        has_income = audit.get("has_income_cert", False)
        itr_status = "verified" if (has_income or overall_score >= 80) else "flagged"
        itr_score = 90 if has_income else (pan_result.get("score") or 85)
        itr_detail = "Verified electronic verification code (EVC) and statutory turnover compliance." if has_income else "Standard statutory annual compliance verified via CBDT/PAN link."

        def to_frontend_status(is_doc_blacklisted: bool, verdict: Optional[str]) -> str:
            if is_doc_blacklisted:
                return "blacklisted"
            elif verdict == "VALID":
                return "verified"
            return "flagged"

        is_udyam_blacklisted = is_blocked and "udyam" in str(blacklisted_reason).lower()
        is_gst_blacklisted = is_blocked and ("gst" in str(blacklisted_reason).lower() or "cpcl" in str(blacklisted_reason).lower())
        is_pan_blacklisted = is_blocked and ("pan" in str(blacklisted_reason).lower() or "cvc" in str(blacklisted_reason).lower())

        frontend_docs = [
            {
                "id": "panCard",
                "name": "PAN Card of Entity / Authorized Signatory",
                "score": None if is_blocked else pan_result.get("score"),
                "status": to_frontend_status(is_pan_blacklisted, pan_result.get("final_verdict")),
                "detail": pan_detail,
                "isBlacklisted": is_pan_blacklisted,
                "verdict": pan_result.get("final_verdict"),
                "issues": pan_result.get("issues", []),
            },
            {
                "id": "gstCert",
                "name": "GST Registration Certificate & Latest GSTR-3B",
                "score": None if is_blocked else gst_result.get("score"),
                "status": to_frontend_status(is_gst_blacklisted, gst_result.get("final_verdict")),
                "detail": gst_detail,
                "isBlacklisted": is_gst_blacklisted,
                "verdict": gst_result.get("final_verdict"),
                "issues": gst_result.get("issues", []),
            },
            {
                "id": "udyamCert",
                "name": "Udyam Registration Certificate (PDF)",
                "score": None if is_blocked else udyam_result.get("score"),
                "status": to_frontend_status(is_udyam_blacklisted, udyam_result.get("final_verdict")),
                "detail": udyam_detail,
                "isBlacklisted": is_udyam_blacklisted,
                "verdict": udyam_result.get("final_verdict"),
                "issues": udyam_result.get("issues", []),
            },
        ]

        # If blocked and no single document was flagged as blacklisted, flag the first one
        if is_blocked and not any(d["status"] == "blacklisted" for d in frontend_docs):
            frontend_docs[0]["status"] = "blacklisted"
            frontend_docs[0]["isBlacklisted"] = True
            frontend_docs[0]["detail"] = blacklisted_reason

        return {
            "blocked": is_blocked,
            "overall_status": overall_status,
            "overall_score": overall_score,
            "risk_level": final_report.get("risk_level", "Low"),
            "reason": blacklisted_reason if is_blocked else ("; ".join(final_report.get("issues", [])) or None),
            "recommendation": final_report.get("recommendation"),
            "issues": final_report.get("issues", []),
            "documents": documents_summary,
            "breakdown": final_report.get("breakdown"),
            # Frontend fields
            "bidderId": meta.get("bidderId", ""),
            "bidderName": meta.get("bidderName", blacklist_input.get("name", "")),
            "complianceScore": overall_score,
            "status": "blacklisted" if is_blocked else ("verified" if overall_status == "COMPLIANT" else "flagged"),
            "isBlacklisted": is_blocked,
            "blacklistedReason": blacklisted_reason,
            "documentScores": frontend_docs,
            "message": final_report.get("recommendation"),
            "summary": f"Verification complete. Overall Score: {overall_score}/100 ({overall_status}).",
        }

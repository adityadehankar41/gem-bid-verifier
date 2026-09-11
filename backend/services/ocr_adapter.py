import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("gem_bid_verifier.ocr_adapter")


def get_ocr_outputs_dir() -> Path:
    """
    Dynamically discovers and returns the path to the OCR outputs directory.
    Checks common location variants (Verification_pipline / Verification_pipeline).
    """
    backend_dir = Path(__file__).resolve().parents[1]
    repo_root = backend_dir.parent

    candidates = [
        repo_root / "Verification_pipline" / "ocr" / "outputs",
        repo_root / "Verification_pipeline" / "ocr" / "outputs",
        backend_dir.parent / "Verification_pipline" / "ocr" / "outputs",
    ]

    for path in candidates:
        if path.exists() and path.is_dir():
            return path

    return candidates[0]


def load_json_records(file_path: Path) -> List[Dict[str, Any]]:
    """
    Safely reads and parses a JSON record file from OCR output directory.
    Returns a list of records, handling missing files and invalid JSON.
    """
    if not file_path.exists():
        logger.warning("OCR output file not found: %s", file_path.name)
        return []

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                return [data]
            return []
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse JSON file %s: %s", file_path.name, exc)
        return []
    except Exception as exc:
        logger.error("Unexpected error reading %s: %s", file_path.name, exc)
        return []


class OCRAdapter:
    """
    Adapter layer connecting OCR output JSON records to verifier inputs.
    Extracts identifiers and metadata expected by the specific verifier modules.
    Matches records by bidder identifier or bidder name before falling back.
    """

    def __init__(self, outputs_dir: Optional[Path] = None):
        self.outputs_dir = outputs_dir or get_ocr_outputs_dir()

    def get_pan_data(self, bidder_fallback: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extracts PAN data formatted for verifiers.pan_verifier2:
        Expected signature: {"pan_no": str, "name": str}
        Matches by bidder's declared PAN or bidderName first; falls back to first OCR record.
        """
        records = load_json_records(self.outputs_dir / "pan_records.json")
        fallback = bidder_fallback or {}

        req_pan = (fallback.get("pan") or "").strip().upper()
        req_name = (fallback.get("bidderName") or "").strip().lower()

        matched_record = None

        if records:
            # 1. Match by PAN number if provided
            if req_pan:
                for rec in records:
                    pans = [str(p).strip().upper() for p in (rec.get("identifiers", {}).get("pan_no") or [])]
                    if req_pan in pans:
                        matched_record = rec
                        break

            # 2. Match by bidder legal name if provided
            if not matched_record and req_name:
                for rec in records:
                    rec_name = str(rec.get("name") or "").strip().lower()
                    if req_name == rec_name or req_name in rec_name or rec_name in req_name:
                        matched_record = rec
                        break

            # 3. Fallback to first record if neither matched and no specific PAN was requested
            if not matched_record and not req_pan:
                matched_record = records[0]

        pan_no = None
        name = None
        if matched_record:
            pan_list = matched_record.get("identifiers", {}).get("pan_no") or []
            if pan_list:
                pan_no = str(pan_list[0]).strip().upper()
            if matched_record.get("name"):
                name = str(matched_record["name"]).strip()

        final_pan = pan_no or fallback.get("pan") or ""
        final_name = name or fallback.get("bidderName") or ""

        return {
            "pan_no": final_pan,
            "name": final_name,
            "source": "ocr" if matched_record else ("request_fallback" if final_pan else "empty"),
            "file_name": matched_record.get("file_name") if matched_record else None,
            "raw_record": matched_record,
        }

    def get_udyam_data(self, bidder_fallback: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extracts Udyam MSME data formatted for verifiers.udyam_verification:
        Expected signature: {"reg_no": str, "entity_name": str, "enterprise_type": str}
        Matches by bidder's declared Udyam or entity_name first; falls back to first OCR record.
        """
        records = load_json_records(self.outputs_dir / "udyam_records.json")
        fallback = bidder_fallback or {}

        req_udyam = (fallback.get("udyam") or "").strip().upper()
        req_name = (fallback.get("bidderName") or "").strip().lower()

        matched_record = None

        if records:
            # 1. Match by Udyam registration number
            if req_udyam:
                for rec in records:
                    udyams = [str(u).strip().upper() for u in (rec.get("identifiers", {}).get("Udyam") or [])]
                    if req_udyam in udyams:
                        matched_record = rec
                        break

            # 2. Match by entity name
            if not matched_record and req_name:
                for rec in records:
                    rec_name = str(rec.get("name") or "").strip().lower()
                    if req_name == rec_name or req_name in rec_name or rec_name in req_name:
                        matched_record = rec
                        break

            # 3. Fallback to first record
            if not matched_record and not req_udyam:
                matched_record = records[0]

        reg_no = None
        entity_name = None
        enterprise_type = None
        if matched_record:
            udyam_list = matched_record.get("identifiers", {}).get("Udyam") or []
            if udyam_list:
                reg_no = str(udyam_list[0]).strip().upper()
            if matched_record.get("name"):
                entity_name = str(matched_record["name"]).strip()
            extra_info = matched_record.get("extra_info", {})
            if extra_info.get("enterprise_type"):
                enterprise_type = str(extra_info["enterprise_type"]).strip()

        final_reg_no = reg_no or fallback.get("udyam") or ""
        final_entity_name = entity_name or fallback.get("bidderName") or ""
        final_enterprise_type = enterprise_type or ""

        return {
            "reg_no": final_reg_no,
            "entity_name": final_entity_name,
            "enterprise_type": final_enterprise_type,
            "source": "ocr" if matched_record else ("request_fallback" if final_reg_no else "empty"),
            "file_name": matched_record.get("file_name") if matched_record else None,
            "raw_record": matched_record,
        }

    def get_gst_data(self, bidder_fallback: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Extracts GST data formatted for verifiers.gst_verification:
        Expected signature: {"gstin": str, "legal_name": str}
        Matches by bidder's declared GSTIN or legal_name first; falls back to first OCR record.
        """
        fallback = bidder_fallback or {}
        req_gstin = (fallback.get("gstin") or "").strip().upper()
        req_name = (fallback.get("bidderName") or "").strip().lower()

        # Look in specific gst output file first
        gst_files = ["gst_records.json", "gst.json"]
        records = []
        for g_file in gst_files:
            records = load_json_records(self.outputs_dir / g_file)
            if records:
                break

        # Also inspect unclassified_records for GSTIN
        if not records:
            unclass = load_json_records(self.outputs_dir / "unclassified_records.json")
            for rec in unclass:
                if rec.get("identifiers", {}).get("GSTIN"):
                    records.append(rec)

        matched_record = None

        if records:
            # 1. Match by GSTIN
            if req_gstin:
                for rec in records:
                    gstins = [str(g).strip().upper() for g in (rec.get("identifiers", {}).get("GSTIN") or [])]
                    if req_gstin in gstins:
                        matched_record = rec
                        break

            # 2. Match by legal name
            if not matched_record and req_name:
                for rec in records:
                    rec_name = str(rec.get("name") or "").strip().lower()
                    if req_name == rec_name or req_name in rec_name or rec_name in req_name:
                        matched_record = rec
                        break

            # 3. Fallback to first record
            if not matched_record and not req_gstin:
                matched_record = records[0]

        gstin = None
        legal_name = None
        if matched_record:
            gst_list = matched_record.get("identifiers", {}).get("GSTIN") or []
            if gst_list:
                gstin = str(gst_list[0]).strip().upper()
            if matched_record.get("name"):
                legal_name = str(matched_record["name"]).strip()

        final_gstin = gstin or fallback.get("gstin") or ""
        final_legal_name = legal_name or fallback.get("bidderName") or ""

        return {
            "gstin": final_gstin,
            "legal_name": final_legal_name,
            "source": "ocr" if matched_record else ("request_fallback" if final_gstin else "empty"),
            "file_name": matched_record.get("file_name") if matched_record else None,
            "raw_record": matched_record,
        }

    def get_blacklist_input(
        self,
        pan_data: Dict[str, Any],
        gst_data: Dict[str, Any],
        udyam_data: Dict[str, Any],
        fallback: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Builds entity identifier object for verifiers.blacklist_verifier:
        Expected signature: {"pan_no": str, "gstin": str, "name": str}
        """
        fb = fallback or {}
        pan_no = pan_data.get("pan_no") or fb.get("pan") or ""
        gstin = gst_data.get("gstin") or fb.get("gstin") or ""
        name = (
            pan_data.get("name")
            or gst_data.get("legal_name")
            or udyam_data.get("entity_name")
            or fb.get("bidderName")
            or ""
        )

        return {
            "pan_no": pan_no,
            "gstin": gstin,
            "name": name,
        }

    def get_additional_audit_records(self) -> Dict[str, Any]:
        """Reads optional statutory records like Aadhaar and Income Certificate for auditing."""
        aadhaar_records = load_json_records(self.outputs_dir / "aadhaar_records.json")
        income_records = load_json_records(self.outputs_dir / "income_records.json")

        return {
            "has_aadhaar": len(aadhaar_records) > 0,
            "aadhaar_count": len(aadhaar_records),
            "has_income_cert": len(income_records) > 0,
            "income_records_count": len(income_records),
        }

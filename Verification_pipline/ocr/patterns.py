import re

PATTERNS = {
    # PAN: 5 uppercase letters, 4 digits, 1 uppercase letter
    "pan_no": r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
    # Aadhaar: 12 digits (continuous or grouped)
    "Aadhaar": r"\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b",
    # MSME Udyam format: e.g., UDYAM-MH-01-0000000
    "Udyam": r"\bUDYAM-[A-Z]{2}-\d{2}-\d{7}\b",
    # Startup India DPIIT recognition number
    "Startup_India": r"\b(?:DIPP|DPIIT)[\s/:-]?\d{4,8}\b",
    # Common Certificate/Application number patterns on Income Certificates
    "Income_Cert_No": r"\b(?:CERT|APPL|INC|EDIST)[\s/:-]?[A-Z0-9/-]{6,20}\b",
    # Annual Income amount indicators
    "Income_Amount": r"(?:Rs\.?|INR|Total\s+Income|Annual\s+Income)\s*[:.-]?\s*([0-9,]+)",
    # GSTIN
    "GSTIN": r"\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b",
    # Calendar date (DD/MM/YYYY or DD-MM-YYYY)
    "Date": r"\b(?:0[1-9]|[12][0-9]|3[01])[/-](?:0[1-9]|1[0-2])[/-]\d{4}\b",
}

def extract_identifiers(text: str) -> dict:
    """Finds all regex identifiers in raw text."""
    found = {}
    for key, pattern in PATTERNS.items():
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        if matches:
            if key == "Startup_India":
                matches = [re.sub(r"[\s/:-]", "", m) for m in matches]
            found[key] = list(set(matches))
    return found


def detect_document_type(text: str, identifiers: dict = None) -> str:
    """Classifies document using regex identifiers and robust keywords."""
    t = text.upper()

    # Priority 1: High-confidence regex matches
    if identifiers:
        if identifiers.get("Udyam"):
            return "UDYAM_CERTIFICATE"
        if identifiers.get("Startup_India"):
            return "STARTUP_INDIA_CERTIFICATE"
        if identifiers.get("pan_no"):
            return "PAN_CARD"
        if identifiers.get("Aadhaar"):
            return "AADHAAR_CARD"

    # Priority 2: Keyword markers
    if any(
        m in t
        for m in [
            "UDYAM REGISTRATION",
            "UDYAM",
            "MINISTRY OF MICRO",
            "MICRO, SMALL & MEDIUM",
            "MSME",
        ]
    ):
        return "UDYAM_CERTIFICATE"

    if any(
        m in t
        for m in [
            "INCOME CERTIFICATE",
            "ANNUAL INCOME",
            "TAHSILDAR",
            "REVENUE DEPARTMENT",
        ]
    ):
        return "INCOME_CERTIFICATE"

    if any(
        m in t
        for m in [
            "STARTUP INDIA",
            "DPIIT",
            "DIPP",
            "CERTIFICATE OF RECOGNITION",
            "PROMOTION OF INDUSTRY",
        ]
    ):
        return "STARTUP_INDIA_CERTIFICATE"

    if any(
        m in t
        for m in [
            "PERMANENT ACCOUNT",
            "INCOME TAX DEPARTMENT",
            "GOVT. OF INDIA",
        ]
    ):
        return "PAN_CARD"

    if any(
        m in t
        for m in ["UNIQUE IDENTIFICATION", "ENROLMENT", "AADHAAR", "UIDAI"]
    ):
        return "AADHAAR_CARD"

    return "UNKNOWN_OR_GENERAL"


def extract_names_and_details(doc_type: str, raw_text: str) -> dict:
    """Extracts candidate names and metadata based on document structure."""
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    details = {"name": None, "extra_info": {}}

    # 1. PAN Card
    if doc_type == "PAN_CARD":
        excluded_words = [
            "INCOME",
            "TAX",
            "DEPARTMENT",
            "GOVT",
            "INDIA",
            "PERMANENT",
            "ACCOUNT",
            "CARD",
            "SIGNATURE",
            "NAME",
            "FATHER",
            "DATE",
            "BIRTH",
        ]
        candidates = []
        for line in lines:
            clean_line = re.sub(r"[^A-Za-z\s]", "", line).strip()
            words = clean_line.split()
            if len(words) >= 2 and not any(
                w.upper() in clean_line.upper() for w in excluded_words
            ):
                candidates.append(clean_line)

        if candidates:
            details["name"] = candidates[0]
            if len(candidates) > 1:
                details["extra_info"]["father_name"] = candidates[1]

    # 2. Aadhaar Card
    elif doc_type == "AADHAAR_CARD":
        dob_index = -1
        for idx, line in enumerate(lines):
            if any(
                k in line.upper()
                for k in ["DOB", "YEAR OF BIRTH", "DATE OF BIRTH"]
            ):
                dob_index = idx
                break

        if dob_index > 0:
            for prev_idx in range(dob_index - 1, -1, -1):
                clean_line = re.sub(r"[^A-Za-z\s]", "", lines[prev_idx]).strip()
                if len(clean_line.split()) >= 2 and not any(
                    k in clean_line.upper()
                    for k in ["GOVERNMENT", "INDIA", "ENROLMENT", "MERA"]
                ):
                    details["name"] = clean_line
                    break

    # 3. Udyam / Startup Certificates
    elif doc_type in ["UDYAM_CERTIFICATE", "STARTUP_INDIA_CERTIFICATE"]:
        for line in lines:
            # --- Name Extraction ---
            match = re.search(
                r"(?:M/s|Enterprise|Startup Name|Company Name)[\s:]+(.+)",
                line,
                re.IGNORECASE,
            )
            if match and not details["name"]:
                details["name"] = match.group(1).strip()
            elif line.upper().startswith("M/S") and not details["name"]:
                details["name"] = line[3:].strip()

            # --- Type of Enterprise Extraction (Micro / Small / Medium) ---
            if doc_type == "UDYAM_CERTIFICATE":
                # Look for explicit labels: "Type of Enterprise: Micro", etc.
                ent_match = re.search(
                    r"(?:Type\s*of\s*Enterprise|Enterprise\s*Type|Category)[\s:]+([A-Za-z]+)",
                    line,
                    re.IGNORECASE,
                )
                if ent_match:
                    val = ent_match.group(1).strip().capitalize()
                    if val.upper() in ["MICRO", "SMALL", "MEDIUM"]:
                        details["extra_info"]["enterprise_type"] = val

        # Fallback keyword search if OCR split the label and value across lines
        if (
            doc_type == "UDYAM_CERTIFICATE"
            and "enterprise_type" not in details["extra_info"]
        ):
            for level in ["MICRO", "SMALL", "MEDIUM"]:
                if re.search(rf"\b{level}\b", raw_text, re.IGNORECASE):
                    details["extra_info"]["enterprise_type"] = (
                        level.capitalize()
                    )
                    break

    return details
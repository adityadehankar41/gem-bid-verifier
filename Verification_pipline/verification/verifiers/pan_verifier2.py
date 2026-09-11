from rapidfuzz import fuzz
import json
# name match thresholds
EXACT_MATCH_THRESHOLD = 98
REVIEW_THRESHOLD = 85

# PAN status categories
VALID_STATUSES = ["Valid"]
REVIEW_STATUSES = ["Inoperative"]
INVALID_STATUSES = ["Cancelled", "Deactivated"]


def verify_pan(extracted_data: dict, mock_pan_db: dict):
    pan_no = (extracted_data.get("pan_no") or "").strip().upper()
    extracted_name = (extracted_data.get("name") or "").strip()

    issues = []
    result = {
        "pan_no": pan_no,
        "found_in_db": None,
        "pan_status": None,
        "aadhaar_linked": None,
        "name_match_status": None,   # EXACT / NEEDS_REVIEW / MISMATCH
        "name_similarity": None,
        "final_verdict": None,       # VALID / NEEDS_REVIEW / INVALID
        "score": 0,
        "issues": issues
    }

    # 1. DB lookup — represents the official NSDL/Protean query
    record = mock_pan_db.get(pan_no)
    result["found_in_db"] = record is not None

    if record is None:
        issues.append("PAN number not found in official database")
        result["final_verdict"] = "INVALID"
        result["score"] = 0
        return result

    result["pan_status"] = record["status"]
    result["aadhaar_linked"] = record["aadhaar_linked"]

    # 2. status check
    # 2. Status check
    pan_status = record["status"]

    if pan_status in INVALID_STATUSES:
        issues.append(f"PAN status is '{pan_status}'")

    elif pan_status in REVIEW_STATUSES:
        issues.append(f"PAN status is '{pan_status}' - verification required")

    elif pan_status not in VALID_STATUSES:
        issues.append(f"Unknown PAN status: '{pan_status}'")

        
    # 3. name match — 3-tier
    similarity = fuzz.ratio(extracted_name.lower(), record["name"].lower())
    result["name_similarity"] = similarity

    if similarity >= EXACT_MATCH_THRESHOLD:
        result["name_match_status"] = "EXACT"
    elif similarity >= REVIEW_THRESHOLD:
        result["name_match_status"] = "NEEDS_REVIEW"
        issues.append(
            f"Name is a close but imperfect match ({similarity}%): "
            f"document says '{extracted_name}', official record says '{record['name']}'"
        )
    else:
        result["name_match_status"] = "MISMATCH"
        issues.append(
            f"Name does not match official record ({similarity}%): "
            f"document says '{extracted_name}', official record says '{record['name']}'"
        )

    # 4. aadhaar linkage — informational compliance flag
    if record["aadhaar_linked"] is False:
        issues.append("PAN is not linked to Aadhaar — treated as inoperative per Income Tax rules")

    # 5. Final verdict

# Invalid status or major name mismatch
    if (
    pan_status in INVALID_STATUSES
    or pan_status not in VALID_STATUSES + REVIEW_STATUSES
    or result["name_match_status"] == "MISMATCH"
    ):
        result["final_verdict"] = "INVALID"
        result["score"] = 0

    # Valid PAN but something needs human review
    elif (
    pan_status in REVIEW_STATUSES
    or result["name_match_status"] == "NEEDS_REVIEW"
    or record["aadhaar_linked"] is False
):
        result["final_verdict"] = "NEEDS_REVIEW"
        result["score"] = 60

# Everything passed
    else:
        result["final_verdict"] = "VALID"
        result["score"] = 100

    return result
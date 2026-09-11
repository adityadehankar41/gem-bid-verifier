from rapidfuzz import fuzz
from datetime import datetime
import json

EXACT_MATCH_THRESHOLD = 98
REVIEW_THRESHOLD = 85



def verify_udyam(extracted_data , mock_db):
    reg_no = (extracted_data.get("reg_no") or "").strip().upper()
    extracted_name = (extracted_data.get("entity_name") or "").strip()
    extracted_type = (extracted_data.get("enterprise_type") or "").strip()

    issues = []
    result = {
        "reg_no" : reg_no,
        "found_in_db" : None,
        "status" : None,
        "enterprise_type_on_record": None,
        "enterprise_type_declared": extracted_type,
        "type_match": None,
        "name_match_status": None,   # EXACT / NEEDS_REVIEW / MISMATCH
        "name_similarity": None,
        "final_verdict": None,       # VALID / NEEDS_REVIEW / INVALID
        "score": 0,
        "issues": issues
        
    }

    # 1. DB lookup for udyam id 

    record = mock_db.get(reg_no)
    result["found_in_db"] = record is not None

    if record is None:
        issues.append("Udyam Registration Number not found on official portal")
        result["final_verdict"] = "INVALID"
        result["score"] = 0
        return result

    result["status"] = record["status"]
    result["enterprise_type_on_record"] = record["enterprise_type"]

    # 2. status check
    if record["status"] != "Active":
        issues.append(f"Udyam status is '{record['status']}' , not active")

    # 3. type/category check
    if extracted_type:
        result["type_match"] = extracted_type.lower() == record["enterprise_type"].lower()
        if not result["type_match"]:
            issues.append(
                f"Enterprise category mismatch: document declares '{extracted_type}', "
                f"official record shows '{record['enterprise_type']}'"
                
            )
    # 4. name_match - same as pan
    similarity = fuzz.ratio(extracted_name.lower(), record["entity_name"].lower())
    result["name_similarity"] = similarity

    if similarity >= EXACT_MATCH_THRESHOLD:
        result["name_match_status"] = "EXACT"
    elif similarity >= REVIEW_THRESHOLD:
        result["name_match_status"] = "NEEDS_REVIEW"
        issues.append(
            f"Entity name is a close but imperfect match ({similarity}%): "
            f"document says '{extracted_name}', official record says '{record['entity_name']}'"
        )
    else:
        result["name_match_status"] = "MISMATCH"
        issues.append(
            f"Entity name does not match official record ({similarity}%): "
            f"document says '{extracted_name}', official record says '{record['entity_name']}'"
        )

    # final
    hard_fail = (
        record["status"] != "Active"
        or result["name_match_status"] == "MISMATCH"
        or result["type_match"] is False
    )

    if hard_fail:
        result["final_verdict"] = "INVALID"
        result["score"] = 0
    elif result["name_match_status"] == "NEEDS_REVIEW":
        result["final_verdict"] = "NEEDS_REVIEW"
        result["score"] = 60
    else:
        result["final_verdict"] = "VALID"
        result["score"] = 100

    return result


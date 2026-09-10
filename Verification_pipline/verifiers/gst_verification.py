from rapidfuzz import fuzz

EXACT_MATCH_THRESHOLD = 98
REVIEW_THRESHOLD = 85


def verify_gst(extracted_data , mock_db):
    gstin = (extracted_data.get("gstin") or "").strip().upper()
    extracted_name = (extracted_data.get("legal_name") or "").strip()

    issues = []
    result = {
        "gstin": gstin,
        "found_in_db": None,
        "registration_status": None,
        "taxpayer_type": None,
        "returns_filed_last_4_quarters": None,
        "name_match_status": None,   # EXACT / NEEDS_REVIEW / MISMATCH
        "name_similarity": None,
        "final_verdict": None,       # VALID / NEEDS_REVIEW / INVALID
        "score": 0,
        "issues": issues
    }

    # 1. DB lookup
    record = mock_db.get(gstin)
    result["found_in_db"] = record is not None

    if record is None:
        issues.append("GSTIN not found on official GST portal")
        result["final_verdict"] = "INVALID"
        result["score"] = 0
        return result

    result["registration_status"] = record["registration_status"]
    result["taxpayer_type"] = record["taxpayer_type"]
    result["returns_filed_last_4_quarters"] = record["returns_filed_last_4_quarters"]

    # registration status check
    if record["registration_status"] != "Active":
        issues.append(f"GST registration status is '{record['registration_status']}' ")

    # name-match
    similarity = fuzz.ratio(extracted_name.lower() , record["legal_name"].lower())
    result["name_similarity"] = similarity

    if similarity >= EXACT_MATCH_THRESHOLD:
        result["name_match_status"] = "EXACT"
    elif similarity >= REVIEW_THRESHOLD:
        result["name_match_status"] = "NEEDS_REVIEW"
        issues.append(
            f"Legal name is a close but imperfect match ({similarity}%): "
            f"document says '{extracted_name}', official record says '{record['legal_name']}'"
        )
    else:
        result["name_match_status"] = "MISMATCH"
        issues.append(
            f"Legal name does not match official record ({similarity}%): "
            f"document says '{extracted_name}', official record says '{record['legal_name']}'"
        )

    # Return filed compilance
    if record["returns_filed_last_4_quarters"] < 4:
        issues.append(
            f"Only {record['returns_filed_last_4_quarters']}/4 returns filed in last 4 quarters"
        )

     # final verdict
    hard_fail = (
        record["registration_status"] != "Active"
        or result["name_match_status"] == "MISMATCH"
    )

    if hard_fail:
        result["final_verdict"] = "INVALID"
        result["score"] = 0
    elif (
        result["name_match_status"] == "NEEDS_REVIEW"
        or record["returns_filed_last_4_quarters"] < 4
    ):
        result["final_verdict"] = "NEEDS_REVIEW"
        result["score"] = 60
    else:
        result["final_verdict"] = "VALID"
        result["score"] = 100

    return result



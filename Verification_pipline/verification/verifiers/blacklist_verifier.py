import json
from rapidfuzz import fuzz


NAME_MATCH_THRESHOLD = 90

def check_single_source(extracted_data , source_name ,  mock_db ):
    #checking bidder against one blacklist score
    pan_no = (extracted_data.get("pan_no") or "").strip().upper()
    gstin = (extracted_data.get("gstin") or "").strip().upper()
    name = (extracted_data.get("name") or "").strip()

    for record in mock_db:
        match_reason = None
        match_type = None


        # 1 . Exact Pan Match
        if record.get("pan") and record["pan"].strip().upper() == pan_no:
            match_reason = "Pan Match"
            match_type = "STRONG"

        # 2 . Exact GSTIN match
        elif record.get("gstin") and record["gstin"].strip().upper() == gstin:
            match_reason = "GSTIN match"
            match_type = "STRONG"

        # 3. Name similarity match
        elif record.get("name"):
            similarity = fuzz.ratio(name.lower() , record["name"].lower())
            if similarity >= NAME_MATCH_THRESHOLD:
                match_reason = f"Name match ({similarity}%)"
                match_type = "REVIEW"

        if match_reason:
            return{
                "source" : source_name ,
                "match_type" : match_type,
                "match_reason" : match_reason,
                "listed_name" : record["name"],
                "debarment_reason" : record.get("reason"),
                "debarred_till" : record.get("debarred_till")

            }
    return None


def verify_blacklist(extracted_data , mock_db):
    matches=[]

    for source_name , records in mock_db.items():
        match = check_single_source(extracted_data , source_name , records)
        if match:
            matches.append(match)

    # No match found
    if not matches:
        return{
            "found_on_blacklist" : False,
            "matched_sources": [],
            "final_verdict" : "VALID",
            "score"  : 100,
            "issues" : []
        }

    # Check for strong match
    strong_matches = [
        m for m in matches
        if m["match_type"] == "STRONG"
    ]

    # Strong PAN/GSTIN match
    if strong_matches:
        issues = [
            f"Debarred per {m['source']} "
            f"({m['match_reason']}) - "
            f"reason: {m.get('debarment_reason') or 'Not provided'}, "
            f"debarred till: {m.get('debarred_till') or 'Not provided'}"
            for m in strong_matches
        ]
        return {
            "found_on_blacklist": True,
            "matched_sources": matches,
            "final_verdict": "DISQUALIFIED",
            "score": 0,
            "issues": issues
        }

    # Only name matches

    issues = [
        f"Possible match on {m['source']}"
        f"({m['match_reason']}) - manual review required"
        for m in matches
    ]

    return{
        "found_on_blacklist": False,
        "matched_sources": matches,
        "final_verdict": "REVIEW",
        "score": 50,
        "issues": issues
}

    # is_blacklisted = len(matches) > 0
    # issues = [
    #     f"Debarred per {m['source']} ({m['match_reason']}) - reason: {m['debarment_reason']} ,"
    #     f"debarred till {m['debarred_till']}" 
    #     for m in matches
    #           ]

    # return{
    #     "found_on_blacklist" : is_blacklisted,
    #     "matched_sources" : matches,
    #     "final_verdict" : "DISQUALIFIED" if is_blacklisted else "VALID",
    #     "score" : 0 if is_blacklisted else 100,
    #     "issues" : issues
    # }
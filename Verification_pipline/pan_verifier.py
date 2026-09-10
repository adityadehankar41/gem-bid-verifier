from rapidfuzz import fuzz

def normalize_text(value):
    if value is None:
        return ""

    return " ".join(str(value).upper().strip().split())


### EXCACT MATCHING REQUIRED FOR PAN AND STATUS
def exact_match(document_value , database_value):
    document_value = normalize_text(document_value)
    database_value = normalize_text(database_value)

    if document_value == database_value: return 100
    else: return 0

### FOR NAMES
def fuzzy_match(document_value , database_value):
    document_value = normalize_text(document_value)
    database_value = normalize_text(database_value)

    return fuzz.ratio(
        document_value,
        database_value
    )



PAN_SCORE_RULES = {
    "valid_name_match": 100,
    "valid_name_mismatch": 70,
    "inoperative_name_match": 60,
    "inoperative_name_mismatch": 30
}
VALID_PAN_STATUSES = {"VALID"}
INOPERATIVE_PAN_STATUSES = {"INOPERATIVE"}



def verify_pan(extracted_data , mock_db):

    pan_no = normalize_text(extracted_data.get("pan_no"))
    if not pan_no:
        return{
            "score" : 0 ,
            "status" : "FAIL",
            "issues" : ["PAN number could not be extracted"]
        }

    record = mock_db.get(pan_no)

    if record is None:
        return{
            "score" : 0,
            "status" : "FAIL" ,
            "issues" : ["Pan not found possibly invalid or fake"]
        }
    if not extracted_data.get("name"):
        return {
        "score": 0,
        "status": "FAIL",
        "issues": ["Name could not be extracted from document"]
    }

    issues = []
    score = 100

    ### WEIGHTED SCORING 100 if exact match else 0
    pan_score = exact_match(
        extracted_data.get("pan_no") , pan_no
    )
    name_score = fuzzy_match(
        extracted_data.get("name") ,
        record.get("name")
    )
    name_matched = name_score >= 97
    # is_valid = record.get("status") == "Valid"

    status = normalize_text(record.get("status"))

    is_valid = status in VALID_PAN_STATUSES
    is_inoperative = status in INOPERATIVE_PAN_STATUSES

    if  not name_matched:
        issues.append("Name mismatch")

    if not is_valid:
        issues.append(f"PAN status is '{record.get('status')}")

    if is_valid and name_matched:
        score = PAN_SCORE_RULES["valid_name_match"]

    elif is_valid and not name_matched:
        score = PAN_SCORE_RULES["valid_name_mismatch"]

    elif is_inoperative and name_matched:
        score = PAN_SCORE_RULES["inoperative_name_match"]

    elif is_inoperative and not name_matched:
        score = PAN_SCORE_RULES["inoperative_name_mismatch"]    

    else:
        score = 0
    # status_score = exact_match(
    #     extracted_data.get("status"),
    #     record.get("status")
    # )

    return{
        "score" : score,
        "pan_score" : pan_score,
        "name_score" : name_score,
        "issues": issues,
        "status" : "PASS" if not issues else "FLAGGED"
        # "status_score": status_score
    }


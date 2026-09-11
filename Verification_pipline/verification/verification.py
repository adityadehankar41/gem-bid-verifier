import json

# from pan_verifier import verify_pan
from verifiers.pan_verifier2 import verify_pan
from verifiers.udyam_verification import verify_udyam
from verifiers.blacklist_verifier import check_single_source , verify_blacklist
from verifiers.gst_verification import verify_gst 


with open("./mock_db/mock_pan_db.json" , "r") as file:
    mock_pan_db = json.load(file)

with open("./extracted_db/fakeextracted_db.json" , "r") as file:
    test_cases = json.load(file)

with open("./mock_db/mock_udyam_db.json" , "r") as f:
    mock_udyam_db = json.load(f)

with open("./extracted_db/fake_extracted_udyam.json" , "r") as f:
    test_cases_udyam = json.load(f)

with open("./mock_db/mock_blacklist_db.json" , "r") as f:
    mock_blacklist_db = json.load(f)

with open("./extracted_db/fake_extracted_blacklist.json" , "r") as f:
    test_cases = json.load(f)

### PAN VERIFICATION
def run_pan_test():
    for case in test_cases:
        result = verify_pan(case["input"] , mock_pan_db)
        print(f"\n {case['label']}")
        print(f"Input : {case['input']}")
        print(f" Result: {result}")

# run_pan_test()

### GST VERIFICATION
def run_gst_test():
    with open("./mock_db/mock_gst.json" , "r") as file:
        mock_gst_db = json.load(file)

    with open("./extracted_db/fake_extracted_gst.json" , "r") as file:
        test_cases = json.load(file)
    for case in test_cases:
        result = verify_gst(case["input"], mock_gst_db)
        print(f"\n{case['label']}")
        print(f"  Input: {case['input']}")
        print(f"Result: {result}")

run_gst_test()


### UDYAM VERIFICATION
def run_udyam_test():
    for case in test_cases_udyam:
        result = verify_udyam(case["input"] , mock_udyam_db)
        print(f"\n{case['label']}")
        print(f"  Input: {case['input']}")
        print(f" Result: {result}")

# run_udyam_test()

def run_blacklist_test():
    for case in test_cases:
        result = verify_blacklist(case["input"], mock_blacklist_db)
        print(f"\n{case['label']}")
        print(f"  Input: {case['input']}")
        print(f" Result: {result}")
        # break
# run_blacklist_test()


        
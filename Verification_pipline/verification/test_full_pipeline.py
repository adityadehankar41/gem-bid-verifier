import json

from verifiers.pan_verifier2 import verify_pan
from verifiers.udyam_verification import verify_udyam
from verifiers.gst_verification import verify_gst
from verifiers.blacklist_verifier import verify_blacklist
from verifiers.aggregator import aggregate_compliance

def load_json(path: str) -> dict:
    with open(path, "r") as f:
        return json.load(f)

def run_full_pipeline(extracted_pan_data, extracted_udyam_data, extracted_gst_data,
                       mock_pan_db, mock_udyam_db, mock_gst_db, mock_blacklist_db):

    pan_result = verify_pan(extracted_pan_data, mock_pan_db)
    udyam_result = verify_udyam(extracted_udyam_data, mock_udyam_db)
    gst_result = verify_gst(extracted_gst_data, mock_gst_db)
    blacklist_result = verify_blacklist(extracted_pan_data, mock_blacklist_db)

    final_report = aggregate_compliance(pan_result, udyam_result, gst_result, blacklist_result)

    return {
        "pan_result": pan_result,
        "udyam_result": udyam_result,
        "gst_result": gst_result,
        "blacklist_result": blacklist_result,
        "final_report": final_report
    }


if __name__ == "__main__":
    # load mock "government" databases
    mock_pan_db = load_json("mock_db/mock_pan_db.json")
    mock_udyam_db = load_json("mock_db/mock_udyam_db.json")
    mock_gst_db = load_json("mock_db/mock_gst.json")
    mock_blacklist_db = load_json("mock_db/mock_blacklist_db.json")

    # load extracted data (simulating what your teammate's extraction module would output)
    extracted_pan = load_json("extracted_db/fakeextracted_db.json")
    extracted_udyam = load_json("extracted_db/fake_extracted_udyam.json")
    extracted_gst = load_json("extracted_db/fake_extracted_gst.json")

    result = run_full_pipeline(
        extracted_pan, extracted_udyam, extracted_gst,
        mock_pan_db, mock_udyam_db, mock_gst_db, mock_blacklist_db
    )

    print("\n--- Individual Results ---")
    print(f"PAN:       {result['pan_result']['final_verdict']} (score: {result['pan_result']['score']})")
    print(f"Udyam:     {result['udyam_result']['final_verdict']} (score: {result['udyam_result']['score']})")
    print(f"GST:       {result['gst_result']['final_verdict']} (score: {result['gst_result']['score']})")
    print(f"Blacklist: {'FOUND' if result['blacklist_result']['found_on_blacklist'] else 'CLEAR'}")

    print("\n--- Final Aggregate Report ---")
    print(json.dumps(result["final_report"], indent=2))
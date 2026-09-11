import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"


def test_health():
    print("\n[TEST 1] GET /api/health")
    with urllib.request.urlopen(f"{BASE_URL}/api/health") as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        print(" -> Status:", data.get("status"))
        print(" -> OCR Dir Found:", data.get("ocr_outputs_found"))
        print(" -> Mock DBs:", data.get("mock_dbs_loaded"))
        assert data.get("ocr_outputs_found") is True
        assert data.get("mock_dbs_loaded", {}).get("pan") > 0


def test_ocr_verification_run():
    print("\n[TEST 2] POST /api/verification/run (using OCR records)")
    req = urllib.request.Request(
        f"{BASE_URL}/api/verification/run",
        data=json.dumps({
            "bidderId": "b1",
            "bidderName": "Sundaram Industrial Equipments Pvt. Ltd.",
            "pan": "AMNPG7909B",
            "udyam": "UDYAM-GJ-22-0199736",
            "gstin": "27ABCPT1234F1Z5"
        }).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        print(" -> Blocked:", data.get("blocked"))
        print(" -> Overall Status:", data.get("overall_status"))
        print(" -> Overall Score:", data.get("overall_score"))
        print(" -> Documents:", list(data.get("documents", {}).keys()))
        doc_scores = data.get("documentScores", [])
        print(" -> Document Scores IDs:", [d.get("id") for d in doc_scores])
        
        # Verify strictly PAN, GST, and Udyam
        assert "pan" in data.get("documents", {})
        assert "gst" in data.get("documents", {})
        assert "udyam" in data.get("documents", {})
        assert len(data.get("documents", {})) == 3
        assert len(doc_scores) == 3
        doc_ids = {d.get("id") for d in doc_scores}
        assert doc_ids == {"panCard", "gstCert", "udyamCert"}


def test_blacklisted_bidder_cvc():
    print("\n[TEST 3] POST /api/verification/run (Blacklisted via CVC list - LMNOC9012Q)")
    req = urllib.request.Request(
        f"{BASE_URL}/api/verification/run",
        data=json.dumps({
            "bidderId": "b_blacklisted",
            "bidderName": "Fake Traders Pvt Ltd",
            "pan": "LMNOC9012Q",
            "gstin": "07LMNOC9012Q1Z8"
        }).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        print(" -> Blocked:", data.get("blocked"))
        print(" -> Overall Status:", data.get("overall_status"))
        print(" -> Reason:", data.get("reason"))
        assert data.get("blocked") is True
        assert data.get("overall_status") == "BLOCKED"
        assert "Debarred" in (data.get("reason") or "")


def test_blacklisted_bidder_gem_suspended():
    print("\n[TEST 4] POST /api/verification/run (Blacklisted via GeM Suspended Sellers - PQRSX5678K)")
    req = urllib.request.Request(
        f"{BASE_URL}/api/verification/run",
        data=json.dumps({
            "bidderId": "b_suspended",
            "bidderName": "XYZ Enterprises",
            "pan": "PQRSX5678K"
        }).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        assert res.status == 200
        data = json.loads(res.read().decode())
        print(" -> Blocked:", data.get("blocked"))
        print(" -> Overall Status:", data.get("overall_status"))
        print(" -> Reason:", data.get("reason"))
        assert data.get("blocked") is True
        assert data.get("overall_status") == "BLOCKED"


def test_docs():
    print("\n[TEST 5] GET /docs (OpenAPI Swagger UI)")
    with urllib.request.urlopen(f"{BASE_URL}/docs") as res:
        assert res.status == 200
        print(" -> Status:", res.status)


def test_vite_proxy():
    print("\n[TEST 6] GET Vite Proxy (/api/health)")
    # Test on whichever port Vite selected (3000 or 3001)
    vite_ports = [3001, 3000]
    success = False
    for port in vite_ports:
        try:
            with urllib.request.urlopen(f"http://localhost:{port}/api/health") as res:
                if res.status == 200:
                    data = json.loads(res.read().decode())
                    print(f" -> Proxied on port {port}:", data.get("status"))
                    assert data.get("status") == "ok"
                    success = True
                    break
        except Exception:
            continue
    assert success, "Vite proxy was not reachable on tested ports"


if __name__ == "__main__":
    print("========================================")
    print("RUNNING END-TO-END VERIFICATION SUITE")
    print("========================================")
    test_health()
    test_ocr_verification_run()
    test_blacklisted_bidder_cvc()
    test_blacklisted_bidder_gem_suspended()
    test_docs()
    test_vite_proxy()
    print("\n========================================")
    print("ALL 6 END-TO-END INTEGRATION TESTS PASSED!")
    print("========================================")

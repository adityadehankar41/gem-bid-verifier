import argparse
import glob
import json
import os
from file_handler import load_file_as_images
from ocr_engine import extract_raw_text
from patterns import (
    detect_document_type,
    extract_identifiers,
    extract_names_and_details,
)
from preprocessor import preprocess_image


def mask_sensitive_identifiers(identifiers: dict) -> dict:
    """Masks sensitive Aadhaar values so private digits are never stored in cleartext."""
    safe_data = {}
    for key, values in identifiers.items():
        if key == "Aadhaar":
            safe_data[key] = ["[Aadhaar Redacted]" for _ in values]
        else:
            safe_data[key] = values
    return safe_data


def process_single_file(file_path: str) -> dict:
    """Runs OCR pipeline on a single document file."""
    print("\n" + "=" * 60)
    print(f"FILE: {os.path.basename(file_path)}")
    print("=" * 60)

    record = {
        "file_name": os.path.basename(file_path),
        "file_path": os.path.abspath(file_path),
        "pages_processed": 0,
        "document_type": "UNKNOWN_OR_GENERAL",
        "name": None,
        "identifiers": {},
        "extra_info": {},
    }

    try:
        pages = load_file_as_images(file_path)
        record["pages_processed"] = len(pages)
        print(f"[✓] Loaded {len(pages)} page(s).")
    except Exception as e:
        print(f"[✗] Loader failed: {e}")
        record["error"] = str(e)
        return record

    all_text = ""
    for idx, page in enumerate(pages):
        clean_img = preprocess_image(page)
        all_text += extract_raw_text(clean_img) + "\n"

    # Extraction & Classification
    raw_identifiers = extract_identifiers(all_text)
    doc_type = detect_document_type(all_text, identifiers=raw_identifiers)
    safe_identifiers = mask_sensitive_identifiers(raw_identifiers)

    # Name and metadata heuristics
    name_data = extract_names_and_details(doc_type, all_text)

    record["document_type"] = doc_type
    record["identifiers"] = safe_identifiers
    record["name"] = name_data.get("name")
    record["extra_info"] = name_data.get("extra_info", {})

    print(f"[✓] Document Type : {doc_type}")
    print(f"[✓] Extracted Name: {record['name']}")
    print(f"[✓] Identifiers   : {safe_identifiers}")

    return record


def append_to_json_file(file_path: str, new_record: dict):
    """Loads existing JSON list, appends new record, and writes back without duplicates."""
    existing_records = []
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                existing_records = json.load(f)
        except json.JSONDecodeError:
            existing_records = []

    # Replace existing record if this file was scanned previously, otherwise append
    updated = False
    for i, item in enumerate(existing_records):
        if item.get("file_name") == new_record.get("file_name"):
            existing_records[i] = new_record
            updated = True
            break

    if not updated:
        existing_records.append(new_record)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(existing_records, f, indent=4)


def save_record_by_category(record: dict, output_dir: str = "./outputs"):
    """Routes an individual record to its corresponding category JSON file."""
    os.makedirs(output_dir, exist_ok=True)

    file_mapping = {
        "PAN_CARD": "pan_records.json",
        "AADHAAR_CARD": "aadhaar_records.json",
        "UDYAM_CERTIFICATE": "udyam_records.json",
        "STARTUP_INDIA_CERTIFICATE": "startup_india_records.json",
        "INCOME_CERTIFICATE": "income_records.json",
        "UNKNOWN_OR_GENERAL": "unclassified_records.json",
    }

    doc_type = record.get("document_type", "UNKNOWN_OR_GENERAL")
    filename = file_mapping.get(doc_type, "unclassified_records.json")
    target_path = os.path.join(output_dir, filename)

    append_to_json_file(target_path, record)
    print(f"[✓] Appended record to: {target_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run OCR on specific files or a folder."
    )
    parser.add_argument(
        "--files",
        nargs="+",
        help="One or more specific image/PDF paths to process.",
    )
    parser.add_argument(
        "--folder",
        help="Path to folder to process all supported documents.",
        default=None,
    )
    parser.add_argument(
        "--output-dir",
        help="Directory to save JSON results.",
        default="./outputs",
    )

    args = parser.parse_args()

    targets = []
    if args.files:
        targets.extend(args.files)
    elif args.folder:
        for ext in ("*.png", "*.jpg", "*.jpeg", "*.pdf"):
            targets.extend(glob.glob(os.path.join(args.folder, ext)))
    else:
        # Default fallback: scan test_images folder if no arguments are passed
        default_folder = "./test_images"
        for ext in ("*.png", "*.jpg", "*.jpeg", "*.pdf"):
            targets.extend(glob.glob(os.path.join(default_folder, ext)))

    if not targets:
        print("No files found to process.")
    else:
        print(f"Target count: {len(targets)} document(s)")
        for path in targets:
            if os.path.exists(path):
                rec = process_single_file(path)
                save_record_by_category(rec, output_dir=args.output_dir)
            else:
                print(f"[!] Skipped: File does not exist -> {path}")
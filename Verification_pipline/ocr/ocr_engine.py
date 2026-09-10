import pytesseract

# Uncomment and set if needed on Windows:
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_raw_text(cv_image) -> str:
    """Runs PyTesseract on thresholded image."""
    config = "--oem 3 --psm 6"
    return pytesseract.image_to_string(cv_image, lang="eng", config=config)
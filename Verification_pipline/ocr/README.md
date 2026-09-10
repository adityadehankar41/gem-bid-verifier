# ID & Registration Document OCR Pipeline

A lightweight Python OCR service built on OpenCV and PyTesseract to preprocess, clean, and extract structured data from identity and business registration documents (PAN, Aadhaar, Udyam, Startup India, etc.).

---

## 1. Prerequisites (System-Level Binaries)

Before installing Python dependencies, install the underlying OS-level binary tools:

### A. Tesseract OCR Engine
* **Windows:**
  1. Download the installer from the [UB-Mannheim Tesseract repository](https://github.com/UB-Mannheim/tesseract/wiki).
  2. Run the installer and note the path (typically `C:\Program Files\Tesseract-OCR`).
  3. *(Optional)* Select additional language packs like **Hindi** during installation if processing bilingual cards.
  4. Add the installation folder to your system `PATH`, or ensure `pytesseract.pytesseract.tesseract_cmd` is set in `ocr_engine.py`.
* **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt-get update
  sudo apt-get install -y tesseract-ocr tesseract-ocr-hin
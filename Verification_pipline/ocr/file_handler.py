import os
from PIL import Image

try:
    from pdf2image import convert_from_bytes
except ImportError:
    convert_from_bytes = None


def load_file_as_images(file_path: str) -> list[Image.Image]:
    """Loads PDF or common image formats and returns a list of PIL Images."""
    ext = os.path.splitext(file_path)[1].lower()

    if ext in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
        img = Image.open(file_path).convert("RGB")
        return [img]

    elif ext == ".pdf":
        if convert_from_bytes is None:
            raise ImportError("Run `pip install pdf2image` to process PDFs.")
        with open(file_path, "rb") as f:
            return convert_from_bytes(f.read())

    else:
        raise ValueError(f"Unsupported file format: {ext}")
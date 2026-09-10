import cv2
import numpy as np
from PIL import Image


def preprocess_image(pil_image: Image.Image) -> np.ndarray:
    """Takes a PIL image and applies CV operations to separate text from watermarks."""
    # Convert PIL to OpenCV format (BGR)
    img_cv = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

    # 1. Scale 2x for thinner card fonts
    img_scaled = cv2.resize(
        img_cv, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC
    )

    # 2. Convert to Grayscale
    gray = cv2.cvtColor(img_scaled, cv2.COLOR_BGR2GRAY)

    # 3. Bilateral filter preserves sharp letter edges while smoothing background noise
    denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # 4. Balanced adaptive thresholding (prevents dropping thin characters)
    binary = cv2.adaptiveThreshold(
        denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 25, 11
    )

    return binary
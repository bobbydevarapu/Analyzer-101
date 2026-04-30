import os
from docx import Document
import PyPDF2
import pytesseract
from PIL import Image
import io
from fastapi import HTTPException
import fitz  # PyMuPDF

# Use a cloud-friendly Tesseract path, with local Windows fallback.
pytesseract.pytesseract.tesseract_cmd = os.getenv(
    "TESSERACT_CMD",
    r"D:\Program Files\tesseract\tesseract.exe"
)


def extract_text(file):
    filename = file.filename.lower()

    # ======================
    # 🔹 TXT
    # ======================
    if filename.endswith(".txt"):
        return file.file.read().decode("utf-8")

    # ======================
    # 🔹 DOCX
    # ======================
    elif filename.endswith(".docx"):
        doc = Document(file.file)
        return " ".join([p.text for p in doc.paragraphs])

    # ======================
    # 🔹 PDF (SMART HANDLING)
    # ======================
    elif filename.endswith(".pdf"):

        # Read file bytes once
        file_bytes = file.file.read()

        # --- TRY NORMAL TEXT EXTRACTION ---
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
            text = ""

            for page in reader.pages:
                text += page.extract_text() or ""

            # ✅ If text exists → return
            if text.strip():
                return text

        except:
            pass

        # --- FALLBACK OCR (🔥 IMPORTANT) ---
        try:
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            text = ""

            for page in doc:
                pix = page.get_pixmap()
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

                text += pytesseract.image_to_string(img)

            if text.strip():
                return text

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

    # ======================
    # ❌ INVALID
    # ======================
    raise HTTPException(status_code=400, detail="Unsupported file format or empty content")
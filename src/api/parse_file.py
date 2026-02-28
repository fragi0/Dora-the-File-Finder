import subprocess
from docx import Document
from PIL import Image
import pytesseract
from pptx import Presentation
import pandas as pd
from openpyxl import load_workbook
import tempfile
import fitz  # PyMuPDF 


def parse_file(file_like, tipo: str):
    data = None

    if tipo == "pdf":
        # PyMuPDF
        file_like.seek(0)
        doc = fitz.open(stream=file_like.read(), filetype="pdf")
        data = ""
        for page in doc:
            data += page.get_text()

    elif tipo == "docx":
        # python-docx file object
        file_like.seek(0)
        document = Document(file_like)
        data = "\n".join([p.text for p in document.paragraphs])

    elif tipo in ["png", "jpg", "jpeg"]:
        file_like.seek(0)
        image = Image.open(file_like)
        data = pytesseract.image_to_string(image)

    elif tipo == "pptx":
        file_like.seek(0)
        data = extract_text_from_pptx(file_like)

    elif tipo in ["xls", "xlsx"]:
        file_like.seek(0)
        # Use openpyxl in read-only 
        wb = load_workbook(file_like, read_only=True)
        data_frames = []
        for sheetname in wb.sheetnames:
            sheet = wb[sheetname]
            # Convert sheet to list of dicts
            rows = list(sheet.values)
            if rows:
                df = pd.DataFrame(rows[1:], columns=rows[0])
                data_frames.append(df)
        if data_frames:
            data = pd.concat(data_frames).to_csv(index=False)
        else:
            data = ""

    else:
        print("Este tipo no se admite en el sistema")
        data = None

    return data


def extract_text_from_pptx(file_like):
    presentation = Presentation(file_like)
    extracted_text = ""

    for slide_number, slide in enumerate(presentation.slides):
        extracted_text += f"\nSlide {slide_number + 1}:\n"
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                extracted_text += shape.text + "\n"

    return extracted_text

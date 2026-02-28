import subprocess
from docx import Document
from PIL import Image
import pytesseract
from pptx import Presentation
import pandas as pd
from openpyxl import load_workbook
import fitz  # PyMuPDF 
from fastapi import UploadFile


def parse_file(file_like: UploadFile) -> str:
   
    data: str = ""

    # Extract file type from UploadFile filename
    if not file_like.filename or "." not in file_like.filename:
        print("El archivo no tiene extensión.")
        return ""

    tipo = file_like.filename.rsplit(".", 1)[-1].lower()

    try:
        if tipo == "pdf":
            # PyMuPDF
            contents = file_like.file.read()
            doc = fitz.open(stream=contents, filetype="pdf")
            for page in doc:
                data += page.get_text()
            file_like.file.seek(0)

        elif tipo == "docx":
            document = Document(file_like.file)
            data = "\n".join([p.text for p in document.paragraphs])
            file_like.file.seek(0)

        elif tipo in ["png", "jpg", "jpeg"]:
            image = Image.open(file_like.file)
            data = pytesseract.image_to_string(image)
            file_like.file.seek(0)

        elif tipo == "pptx":
            data = extract_text_from_pptx(file_like.file)
            file_like.file.seek(0)

        elif tipo in ["xls", "xlsx"]:
            wb = load_workbook(file_like.file, read_only=True)
            data_frames = []
            for sheetname in wb.sheetnames:
                sheet = wb[sheetname]
                rows = list(sheet.values)
                if rows:
                    df = pd.DataFrame(rows[1:], columns=rows[0])
                    data_frames.append(df)
            if data_frames:
                data = pd.concat(data_frames).to_csv(index=False)
            else:
                data = ""
            file_like.file.seek(0)

        else:
            print(f"Tipo de archivo '{tipo}' no se admite.")
            data = ""

    except Exception as e:
        print(f"Error al procesar el archivo: {e}")
        data = ""

    return data


def extract_text_from_pptx(file_like) -> str:
    """
    Extract text from a PPTX file-like object.
    """
    presentation = Presentation(file_like)
    extracted_text: str = ""

    for slide_number, slide in enumerate(presentation.slides):
        extracted_text += f"\nSlide {slide_number + 1}:\n"
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                extracted_text += shape.text + "\n"

    return extracted_text

from docx import Document
from PIL import Image
import numpy as np
import pytesseract
from pptx import Presentation
import pandas as pd
from openpyxl import load_workbook
from pypdf import PdfReader
from fastapi import UploadFile
import io


def parse_file(file_like: UploadFile) -> str:
    """
    Extract text content from various file types.
    Optimized for large files to minimize memory usage.
    Supports: PDF, DOCX, PPTX, PNG/JPG/JPEG, XLS/XLSX.
    """
    data: str = ""

    # Validate filename
    if not file_like.filename or "." not in file_like.filename:
        print("El archivo no tiene extensión.")
        return ""

    tipo = file_like.filename.rsplit(".", 1)[-1].lower()

    try:
        # ---------------- PDF ----------------
        if tipo == "pdf":
            reader = PdfReader(file_like.file)
            for pag in range(len(reader.pages)):
                page = reader.pages[0]
                text = page.extract_text()
                data += text

        # ---------------- DOCX ----------------
        elif tipo == "docx":
            document = Document(file_like.file)
            paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
            # Extract tables
            for table in document.tables:
                for row in table.rows:
                    row_text = "\t".join([cell.text for cell in row.cells])
                    paragraphs.append(row_text)
            data = "\n".join(paragraphs)
            file_like.file.seek(0)

        # ---------------- IMAGES ----------------
        elif tipo in ["png", "jpg", "jpeg"]:
            image = Image.open(file_like.file)
            
            # Resize if very large to reduce memory usage
            max_size = (1024, 1024)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            data = pytesseract.image_to_string(image).strip()
            file_like.file.seek(0)

        # ---------------- PPTX ----------------
        elif tipo == "pptx":
            data = extract_text_from_pptx(file_like.file)
            file_like.file.seek(0)

        # ---------------- EXCEL ----------------
        elif tipo in ["xls", "xlsx"]:
            # Try pandas read_excel in chunks to reduce memory usage
            try:
                excel_file = pd.ExcelFile(file_like.file)
                output = io.StringIO()
                for sheet_name in excel_file.sheet_names:
                    for chunk in pd.read_excel(file_like.file, sheet_name=sheet_name, chunksize=1000):
                        chunk.to_csv(output, index=False, header=False)
                data = output.getvalue()
            except Exception:
                # Fallback for xlsx with openpyxl
                wb = load_workbook(file_like.file, read_only=True)
                dfs = []
                for sheetname in wb.sheetnames:
                    sheet = wb[sheetname]
                    rows = list(sheet.values)
                    if rows:
                        df = pd.DataFrame(rows[1:], columns=rows[0])
                        dfs.append(df)
                if dfs:
                    data = pd.concat(dfs).to_csv(index=False)
                else:
                    data = ""
            file_like.file.seek(0)

        else:
            if is_binary(not file_like.file):
                # ---------------- TXT ----------------
                f = open(file_like.file)
                data = f.read() 
            else:
                print(f"Error al procesar el archivo: {e}")
            

    except Exception as e:
        print(f"Error al procesar el archivo: {e}")
        data = ""

    return data.strip()


def extract_text_from_pptx(file_like) -> str:
    """
    Extract text from a PPTX file-like object safely.
    """
    presentation = Presentation(file_like)
    extracted_text: str = ""

    for slide_number, slide in enumerate(presentation.slides):
        extracted_text += f"\nSlide {slide_number + 1}:\n"
        for shape in slide.shapes:
            if hasattr(shape, "has_text_frame") and shape.has_text_frame:
                extracted_text += shape.text.strip() + "\n"

    return extracted_text.strip()

def is_binary(file_name):
    try:
        with open(file_name, 'tr') as check_file:  # try open file in text mode
            check_file.read()
            return False
    except:  # if fail then file is non-text (binary)
        return True


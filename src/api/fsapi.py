import aiosqlite
import secrets
from parse_file import parse_file
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from google import genai

# Asegúrate de ejecutar: AIzaSyBvszSQ6-aQU6D7TJLbAjaFYkal8sZX0Ro en tu terminal
ai_client = genai.Client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
DATABASE_PATH = "app.db"


async def get_db():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


@app.on_event("startup")
async def startup():
    async with aiosqlite.connect(DATABASE_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_filename TEXT NOT NULL,
                stored_filename TEXT UNIQUE NOT NULL,
                content_type TEXT,
                size INTEGER NOT NULL,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ai_summary TEXT
            )
        """)
        await db.commit()


def secure_filename(original_filename: str) -> str:
    ext = Path(original_filename).suffix
    return f"{secrets.token_urlsafe(16)}{ext}"


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: aiosqlite.Connection = Depends(get_db)
):
    if not file:
        raise HTTPException(400, "No se envió ningún archivo")

    try:
        extracted_text = parse_file(file)
    except Exception as e:
        raise HTTPException(500, f"Error al parsear el archivo: {e}")

    await file.seek(0)

    stored_name = secure_filename(file.filename)
    file_path = UPLOAD_DIR / stored_name

    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
        raise HTTPException(500, f"Error al guardar archivo: {e}")

    file_size = file_path.stat().st_size

    prompt_hardcodeado = "Analiza el siguiente texto y extrae las ideas principales:\n\n"
    prompt_completo = f"{prompt_hardcodeado}{extracted_text}"

    try:
        # Cambia el nombre del modelo si tienes uno específico en tu entorno
        response = ai_client.models.generate_content(
            model='gemma-3-27b-it',
            contents=prompt_completo,
        )
        ai_response_text = response.text
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(500, f"Error al consultar la IA: {e}")

    # 4. Guardar en Base de Datos
    try:
        await db.execute("""
            INSERT INTO files (original_filename, stored_filename,
            content_type, size, upload_date, ai_summary)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            file.filename, stored_name, file.content_type, file_size,
            datetime.now(timezone.utc), ai_response_text
        ))
        await db.commit()
        cursor = await db.execute("SELECT last_insert_rowid()")
        row = await cursor.fetchone()
        file_id = row[0]
    except aiosqlite.Error as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(500, f"Error en base de datos: {e}")
    finally:
        await file.close()

    # 5. Devolver la respuesta al Frontend
    return {
        "id": file_id,
        "filename": file.filename,
        "message": "Archivo procesado con éxito",
        "ai_analysis": ai_response_text
}

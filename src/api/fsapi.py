import re
import json
import aiosqlite
import secrets
from parse_file import parse_file
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from google import genai

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
                file_plaintext TEXT,
                extracted_data TEXT
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
        raise HTTPException(400, "No file sent")

    try:
        extracted_text = await parse_file(file)
    except Exception as e:
        raise HTTPException(500, f"Parsing error: {e}")

    await file.seek(0)

    stored_name = secure_filename(file.filename)
    file_path = UPLOAD_DIR / stored_name

    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
        raise HTTPException(500, f"Error saving file: {e}")

    file_size = file_path.stat().st_size

    prompt = (
        "Extract unique entities from the text below. "
        'Output ONLY valid JSON with this exact structure: '
        '{"times": [], "dates": [], "places": [], "names": [], '
        '"keywords": []}. '
        "Rules: 1. No duplicates. 2. Use full names. 3. 'keywords' must be a "
        "comprehensive list of terms to help another LLM retrieve this text "
        "later. "
        "No markdown formatting, no conversational text. Text: \n\n"
    ) + extracted_text

    try:
        response = await ai_client.aio.models.generate_content(
            model='gemma-3-27b-it',
            contents=prompt,
        )
        ai_response_text = response.text
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(500, f"Error: LLM connection failed: {e}")

    try:
        await db.execute("""
            INSERT INTO files (original_filename, stored_filename,
            content_type, size, file_plaintext, extracted_data)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            file.filename, stored_name, file.content_type, file_size,
            extracted_text, get_parsed_data(ai_response_text, False)))
        await db.commit()
        cursor = await db.execute("SELECT last_insert_rowid()")
        row = await cursor.fetchone()
        file_id = row[0]
    except aiosqlite.Error as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(500, f"Database error: {e}")
    finally:
        await file.close()

    return {
        "id": file_id,
        "filename": file.filename,
        "message": "File successfully stored",
        }


def get_parsed_data(ai_response_text, tried):
    raw_json = ai_response_text.strip()
    if raw_json.startswith("```json"):
        raw_json = raw_json[7:]
    elif raw_json.startswith("```"):
        raw_json = raw_json[3:]
    if raw_json.endswith("```"):
        raw_json = raw_json[:-3]
    raw_json = raw_json.strip()

    try:
        parsed_data = json.loads(raw_json)

        expected_keys = ["times", "dates", "places", "names", "keywords"]
        for key in expected_keys:
            if key not in parsed_data:
                parsed_data[key] = []

        return json.dumps(parsed_data)
    except json.JSONDecodeError:
        if not tried:
            match = re.search(r'\{.*\}', ai_response_text, re.DOTALL)
            if match:
                return get_parsed_data(match.group(0), True)
            else:
                return get_parsed_data("", True)
        else:
            return json.dumps({
                "times": [], "dates": [], "places": [], "names": [],
                "keywords": [], "error": "Failed to parse LLM response",
                "raw_text": raw_json
            })

import re
import json
import aiosqlite
import secrets
from parse_file import parse_file
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from fastapi.staticfiles import StaticFiles

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
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
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
        "later. 4. 'dates' shoud always be in YYYY-MM-DD format. "
        "No markdown formatting, no conversational text. Text: \n\n"
        ) + extracted_text[:80000]

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


@app.get("/search")
async def search_files(
    query: str,
    db: aiosqlite.Connection = Depends(get_db)
):
    prompt_extract_tokens = (
        "Extract key search terms from the user query for SQL LIKE matching. "
        "Target files were previously indexed extracting "
        "these specific entities: times, dates (strictly YYYY-MM-DD format), "
        "places, full names, and general keywords. "
        "Output ONLY a comma-separated list of terms "
        "(exact or paraphrased from the query) "
        "that would match these categories. If you are unable to "
        "extract useful key terms from the query, "
        "the keywords then should be the words in the query comma-separated. "
        "No markdown, no conversational text. \n\n"
        f"Query: {query}"
    )
    try:
        res_tokens = await ai_client.aio.models.generate_content(
            model='gemma-3-12b-it',
            contents=prompt_extract_tokens
        )

        raw_tokens = res_tokens.text.strip()
        search_tokens = [t.strip() for t in raw_tokens.split(",") if t.strip()]
        print("Debug0 \n")
        print(query)
        print("Debug1 \n")
        print(search_tokens)
        print("Fin debug")

    except Exception as e:
        raise HTTPException(500, f"Error occurred during tokenization "
                            f"of your search query: {e}")

    answer_text = ""

    response_data = {
            "answer": answer_text
            }

    if not search_tokens:
        response_data["answer"] = ("No keywords could be extracted "
                                   "from your search query.")
        return response_data

    # WHERE (extracted_data LIKE '%A%' OR file_plaintext LIKE '%A%')
    # OR (extracted_data LIKE '%B%' OR file_plaintext LIKE '%B%')

    conditions = []
    params = []
    for token in search_tokens:
        conditions.append("(extracted_data LIKE ? OR file_plaintext LIKE ?)")
        params.extend([f"%{token}%", f"%{token}%"])

    where_clause = " OR ".join(conditions)
    sql_query = ("SELECT original_filename, stored_filename, content_type,"
                 "upload_date, file_plaintext FROM files WHERE "
                 f"{where_clause} ORDER BY upload_date DESC LIMIT 3")

    try:
        cursor = await db.execute(sql_query, params)
        results = await cursor.fetchall()
    except aiosqlite.Error as e:
        raise HTTPException(500, f"Data base error: {e}")

    if not results:
        response_data["answer"] = "No related documents found"
        return response_data

    context_text = ""
    for row in results:
        texto_seguro = row['file_plaintext'][:40000]
        context_text += (f"\n--- FILE: {row['original_filename']} ---\n"
                         f"{texto_seguro}\n")

    prompt_generate_answer = f"""
        Answer the user's query in a friendly tone
        using ONLY the provided files.

        Rules:
        1. Evaluate if each file is relevant to the query.
        2. If relevant, explain why based strictly on its plaintext content.
        3. STRICTLY IGNORE irrelevant files. Do not mention them at all.
        4. If NONE of the files are relevant, politely explain
        that the retrieved documents don't seem to match what
        they are looking for, and ask them to reformulate the query.

        Query: {query}

        Files context:
        {context_text}
    """
    try:
        final_response = await ai_client.aio.models.generate_content(
            model='gemma-3-27b-it',
            contents=prompt_generate_answer
        )
        answer_text = final_response.text.strip()
    except Exception as e:
        raise HTTPException(500, f"Error generando la respuesta final: {e}")

    for index, row in enumerate(results):
        filename = row['original_filename']
        filetype = (filename.rsplit(".", 1)[-1].lower()
                    if "." in filename else "unknown")

        source_key = f"source{index + 1}"

        response_data[source_key] = {
            "filename": filename,
            "filetype": filetype,
            "path": f"/uploads/{row['stored_filename']}",
            "upload_date": row['upload_date']
        }

    response_data["answer"] = answer_text
    return response_data

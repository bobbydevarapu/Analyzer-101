from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os

load_dotenv()

# ✅ IMPORTANT: import get_embeddings also
from .core.similarity import compare, get_embeddings
from .core.decision import classify
from .database import submissions_collection, results_collection
from .utils.file_utils import extract_text
from .utils.email_utils import send_email

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

# ========================
# CORS
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# ROOT
# ========================
@app.get("/")
def home():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# ========================
# SUBMIT
# ========================
@app.post("/submit")
async def submit(
    assignment_id: str = Form(...),
    roll: str = Form(...),
    email: str = Form(...),
    file: UploadFile = File(...)
):
    text = extract_text(file)

    if not text.strip():
        raise HTTPException(400, "Empty file content")

    existing = submissions_collection.find_one({
        "assignment_id": assignment_id,
        "roll": roll
    })

    if existing:
        raise HTTPException(400, "Already submitted")

    submissions_collection.insert_one({
        "assignment_id": assignment_id,
        "roll": roll,
        "email": email,
        "text": text
    })

    return {"message": "Submission successful"}


# ========================
# ANALYZE (🔥 FIXED)
# ========================
@app.post("/analyze/{assignment_id}")
def analyze(assignment_id: str):

    students = list(submissions_collection.find(
        {"assignment_id": assignment_id},
        {"_id": 0}
    ))

    if len(students) < 2:
        return {"error": "Need at least 2 submissions"}

    results = []
    matrix = []

    # 🔥 IMPORTANT: compute embeddings ONCE
    texts = [s["text"] for s in students]
    embeddings = get_embeddings(texts)

    # MATRIX
    for i in range(len(students)):
        row = []
        for j in range(len(students)):
            if i == j:
                row.append(100)
            else:
                res = compare(
                    students[i]["text"],
                    students[j]["text"],
                    embeddings[i],
                    embeddings[j]
                )
                row.append(res["final_score"])
        matrix.append(row)

    # RESULTS
    for i in range(len(students)):
        for j in range(i + 1, len(students)):
            res = compare(
                students[i]["text"],
                students[j]["text"],
                embeddings[i],
                embeddings[j]
            )
            final = classify(res)

            if final["status"] != "Normal":
                results.append({
                    "student1": students[i]["roll"],
                    "student2": students[j]["roll"],
                    "score": res["final_score"],
                    "status": final["status"],
                    "email1": students[i]["email"],
                    "email2": students[j]["email"]
                })

    student_rolls = [s.get("roll") for s in students]

    results_collection.update_one(
        {"assignment_id": assignment_id},
        {"$set": {
            "matrix": matrix,
            "results": results,
            "students": student_rolls
        }},
        upsert=True
    )

    return {
        "total_students": len(students),
        "students": student_rolls,
        "matrix": matrix,
        "results": results
    }


# ========================
# SEND EMAIL
# ========================
@app.post("/send/{assignment_id}")
def send(assignment_id: str):

    data = results_collection.find_one({"assignment_id": assignment_id}, {"_id": 0})

    if not data:
        return {"error": "No results found"}

    if not data.get("results"):
        return {"message": "No flagged submissions", "sent_count": 0}

    sent = set()

    for r in data["results"]:
        for email in [r["email1"], r["email2"]]:
            if email in sent:
                continue

            send_email(
                email,
                f"Assignment Alert - {assignment_id}",
                f"Similarity: {r['score']}%, Status: {r['status']}"
            )
            sent.add(email)

    return {"message": "Emails sent", "sent_count": len(sent)}


# ========================
# DELETE
# ========================
@app.delete("/delete/{assignment_id}")
def delete_assignment(assignment_id: str, authorization: str = Header(None)):

    token = os.environ.get("ADMIN_TOKEN")

    if not authorization or f"Bearer {token}" != authorization:
        raise HTTPException(403, "Unauthorized")

    submissions_collection.delete_many({"assignment_id": assignment_id})
    results_collection.delete_many({"assignment_id": assignment_id})

    return {"message": "Deleted successfully"}


# ========================
# ADMIN LOGIN
# ========================
@app.post("/admin/login")
def admin_login(username: str = Form(...), password: str = Form(...)):

    if username == os.getenv("ADMIN_USER") and password == os.getenv("ADMIN_PASS"):
        return {"token": os.getenv("ADMIN_TOKEN")}

    raise HTTPException(401, "Invalid credentials")


# ========================
# ADMIN LIST
# ========================
@app.get("/admin/assignments")
def list_assignments(authorization: str = Header(None)):

    token = os.environ.get("ADMIN_TOKEN")

    if not authorization or f"Bearer {token}" != authorization:
        raise HTTPException(403, "Unauthorized")

    assignments = list(results_collection.find({}, {"_id": 0}))

    return {"assignments": assignments}


# ========================
# STATIC FILES (KEEP LAST)
# ========================
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
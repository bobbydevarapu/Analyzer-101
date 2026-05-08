from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

app = FastAPI(
    title="AiA"
)

import logging

# Ensure logs directory exists
logs_dir = "backend/logs"
os.makedirs(logs_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=[
        logging.FileHandler(
            f"{logs_dir}/email.log",
            encoding="utf-8"
        ),
        logging.StreamHandler()
    ]
)

@app.on_event("startup")
def preload_similarity_model():
    from .core.similarity import get_model

    get_model()
    print("✅ Similarity model ready")

# Ensure package context so relative imports inside submodules work
import sys
from pathlib import Path
if __package__ is None or __package__ == "":
    pkg_name = Path(__file__).parent.name
    parent_dir = str(Path(__file__).resolve().parent.parent)
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    __package__ = pkg_name

try:
    from .routers.analysis import (
        router as analysis_router
    )
    from .routers.student import (
        router as student_router
    )
    from .routers.teacher import (
        router as teacher_router
    )
except Exception:
    # allow running as script from the backend folder (no package parent)
    from routers.analysis import router as analysis_router
    from routers.student import router as student_router
    from routers.teacher import router as teacher_router

app.include_router(
    analysis_router
)
app.include_router(
    student_router
)
app.include_router(
    teacher_router
)

# ========================
# AUTH ROUTES
# ========================
try:
    try:
        from .auth.routes import router as auth_router
    except Exception:
        from auth.routes import router as auth_router
    app.include_router(auth_router)
    print("✅ Auth routes loaded successfully")
except Exception as e:
    print("❌ Failed to load auth routes:", e)

# ========================
# CORE IMPORTS
# ========================
try:
    from .core.similarity import compare, get_embeddings
    from .core.decision import classify
    from .database import submissions_collection, results_collection, users_collection, teacher_requests_collection
    from .utils.file_utils import extract_text
    from .utils.email_utils import send_email
except Exception:
    from core.similarity import compare, get_embeddings
    from core.decision import classify
    from database import submissions_collection, results_collection, users_collection, teacher_requests_collection
    from utils.file_utils import extract_text
    from utils.email_utils import send_email

ADMIN_SETTINGS = {
    "similarity_threshold": float(os.environ.get("SIMILARITY_THRESHOLD", "0.75")),
    "max_violations": int(os.environ.get("MAX_VIOLATIONS", "10")),
    "cooldown_assignments": int(os.environ.get("COOLDOWN_ASSIGNMENTS", "5")),
}

# ========================
# CORS
# ========================
allowed_origins = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# SUBMIT ASSIGNMENT
# ========================
@app.post("/submit")
async def submit(
    assignment_id: str = Form(None),
    dept: str = Form(None),
    roll: str = Form(...),
    email: str = Form(...),
    file: UploadFile = File(...)
):
    email = email.strip().lower()
    roll = roll.strip().upper()

    if assignment_id:
        assignment_id = assignment_id.strip().upper()

    if dept:
        dept = dept.strip().upper()

    # Block students who already reached max copied count.
    copied_count = 0

    for result_doc in results_collection.find({}, {"results": 1}):
        for pair in result_doc.get("results", []):
            if (
                pair.get("email1", "").strip().lower() == email
                or pair.get("email2", "").strip().lower() == email
            ):
                copied_count += 1

    if copied_count >= 10:
        raise HTTPException(
            403,
            "Submission blocked: violation limit reached"
        )

    if assignment_id and assignment_id.strip() and (not dept or not dept.strip()):

        if "-A" in assignment_id:
            dept = assignment_id.split("-A")[0].strip()

        elif "-" in assignment_id:
            dept = assignment_id.split("-")[0].strip()

    if not dept or not dept.strip():
        raise HTTPException(400, "Department is required")

    dept = dept.strip().upper()

    text = extract_text(file)

    if not text.strip():
        raise HTTPException(400, "Empty file content")

    if not assignment_id or assignment_id.strip() == "":

        last = submissions_collection.find_one(
            {"assignment_id": {"$regex": f"^{dept}-A"}},
            sort=[("assignment_id", -1)]
        )

        new_num = 1

        if last and last.get("assignment_id"):
            try:
                last_num = int(last["assignment_id"].split("A")[-1])
                new_num = last_num + 1
            except:
                pass

        assignment_id = f"{dept}-A{new_num}"

    if submissions_collection.find_one({
        "assignment_id": assignment_id,
        "roll": roll
    }):
        raise HTTPException(400, "Already submitted")

    submissions_collection.insert_one({
        "assignment_id": assignment_id,
        "dept": dept,
        "roll": roll,
        "email": email,
        "text": text,
        "created_at": datetime.utcnow().isoformat() + "Z"
    })

    return {
        "message": "Submission successful",
        "assignment_id": assignment_id
    }



# ========================
# ADMIN LOGIN
# ========================
@app.post("/admin/login")
def admin_login(username: str = Form(...), password: str = Form(...)):
    if username == os.getenv("ADMIN_USER") and password == os.getenv("ADMIN_PASS"):
        return {"token": os.getenv("ADMIN_TOKEN")}
    raise HTTPException(401, "Invalid credentials")

@app.get("/admin/assignments")
def list_assignments(authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    raw = list(results_collection.find({}, {"_id": 0}))
    assignments = []
    for r in raw:
        assignments.append({
            "assignment_id": r.get("assignment_id"),
            "student_count": len(r.get("students", [])),
            "flagged_count": len(r.get("results", []))
        })
    return {"assignments": assignments}

@app.get("/admin/teacher-requests")
def list_teacher_requests(authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    requests = list(teacher_requests_collection.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1))
    return {"requests": requests}

@app.post("/admin/teacher-requests/{email}/approve")
def approve_teacher_request(email: str, authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    request = teacher_requests_collection.find_one({"email": email, "status": "pending"})
    if not request:
        raise HTTPException(404, "Teacher request not found")

    users_collection.update_one({"email": email}, {"$set": {"approved": True}})
    teacher_requests_collection.delete_one({"email": email})
    return {"message": "Teacher approved", "email": email}

@app.delete("/admin/teacher-requests/{email}/reject")
def reject_teacher_request(email: str, authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    request = teacher_requests_collection.find_one({"email": email, "status": "pending"})
    if not request:
        raise HTTPException(404, "Teacher request not found")

    teacher_requests_collection.delete_one({"email": email})
    users_collection.delete_one({"email": email, "role": "teacher"})
    return {"message": "Teacher rejected", "email": email}

@app.get("/admin/assignment/{assignment_id}")
def admin_assignment_detail(assignment_id: str, authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    data = results_collection.find_one({"assignment_id": assignment_id}, {"_id": 0})
    if not data:
        return {
            "assignment_id": assignment_id,
            "students": [],
            "matrix": [],
            "results": []
        }

    return {
        "assignment_id": data.get("assignment_id", assignment_id),
        "students": data.get("students", []),
        "matrix": data.get("matrix", []),
        "results": data.get("results", [])
    }

@app.get("/get-student/{email}")
def get_student(email: str):
    email = (email or "").strip().lower()
    if not email:
        raise HTTPException(400, "Email is required")

    try:
        return build_student_profile(email)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"❌ Failed to build student profile for {email}: {exc}")
        raise HTTPException(500, "Failed to load student profile") from exc

def count_student_violations(email: str):
    results = list(results_collection.find({}, {"_id": 0}))
    copied = 0
    violations = []
    for r in results:
        pairs = r.get("results", [])
        if not isinstance(pairs, list):
            continue

        for pair in pairs:
            if not isinstance(pair, dict):
                continue
            if pair.get("email1") == email or pair.get("email2") == email:
                copied += 1
                violations.append({
                    "assignment_id": r.get("assignment_id"),
                    "status": pair.get("status"),
                    "score": pair.get("score"),
                    "against_roll": pair.get("student2") if pair.get("email1") == email else pair.get("student1")
                })
    return copied, violations

def build_student_profile(email: str):
    email = (email or "").strip().lower()
    user = users_collection.find_one({"email": email, "role": "student"}, {"_id": 0}) or {}
    submissions = list(submissions_collection.find(
        {"email": email},
        {"_id": 0, "assignment_id": 1, "dept": 1, "roll": 1, "created_at": 1}
    ))
    copied, violations = count_student_violations(email)
    adjustment = int(user.get("violation_adjustment", 0) or 0)
    adjusted_violations = max(0, copied - adjustment)
    max_violations = ADMIN_SETTINGS["max_violations"]

    history = [
        {
            "assignment_id": s.get("assignment_id"),
            "dept": s.get("dept"),
            "roll": s.get("roll"),
            "submitted_at": s.get("created_at")
        }
        for s in submissions
    ]

    return {
        "name": user.get("name") or user.get("full_name") or email.split("@")[0],
        "email": email,
        "dept": user.get("dept") or user.get("department") or "Unknown",
        "total": len(submissions),
        "copied": copied,
        "violations_count": adjusted_violations,
        "history": history,
        "violations": violations,
        "blocked": adjusted_violations >= max_violations,
        "remaining_before_block": max(0, max_violations - adjusted_violations),
        "blocked_submissions_remaining": int(user.get("blocked_submissions_remaining", 0) or 0),
        "cooldown_assignments": ADMIN_SETTINGS["cooldown_assignments"],
        "max_violations": max_violations
    }

@app.get("/admin/teachers")
def admin_teachers(authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    teachers = []
    for user in users_collection.find({"role": "teacher"}, {"_id": 0}):
        teachers.append({
            "name": user.get("name") or user.get("full_name") or "Teacher",
            "email": user.get("email"),
            "department": user.get("dept") or user.get("department") or "Unknown",
            "approved": bool(user.get("approved", False)),
            "status": "approved" if user.get("approved") else "pending"
        })
    return {"teachers": teachers}

@app.get("/admin/students")
def admin_students(authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    students = []
    for user in users_collection.find({"role": "student"}, {"_id": 0}):
        email = user.get("email")
        if not email:
            continue

        try:
            profile = build_student_profile(email)
        except Exception as exc:
            print(f"⚠️ Skipping invalid student record {email}: {exc}")
            continue

        students.append({
            "name": profile["name"],
            "email": email,
            "department": profile["dept"],
            "violations": profile["violations_count"],
            "blocked": profile["blocked"],
            "status": "Blocked" if profile["blocked"] else ("Critical" if profile["violations_count"] >= 8 else "Risk" if profile["violations_count"] >= 4 else "Safe"),
            "cooldown_remaining": profile["cooldown_assignments"] if profile["blocked"] else 0,
            "submissions": profile["total"]
        })
    return {"students": students}

@app.get("/admin/settings")
def admin_settings(authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    return ADMIN_SETTINGS

@app.patch("/admin/settings")
def update_admin_settings(
    similarity_threshold: float | None = Form(None),
    max_violations: int | None = Form(None),
    cooldown_assignments: int | None = Form(None),
    authorization: str = Header(None)
):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    if similarity_threshold is not None:
        ADMIN_SETTINGS["similarity_threshold"] = similarity_threshold
    if max_violations is not None:
        ADMIN_SETTINGS["max_violations"] = max_violations
    if cooldown_assignments is not None:
        ADMIN_SETTINGS["cooldown_assignments"] = cooldown_assignments
    return ADMIN_SETTINGS

@app.delete("/admin/users/{email}")
def admin_delete_user(email: str, role: str, authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    result = users_collection.delete_one({"email": email, "role": role})
    if not result.deleted_count:
        raise HTTPException(404, "User not found")
    return {"message": "User deleted", "email": email, "role": role}

@app.post("/admin/students/{email}/unblock")
def admin_unblock_student(email: str, authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    users_collection.update_one({"email": email, "role": "student"}, {"$set": {"blocked_submissions_remaining": 0}})
    return {"message": "Student unblocked", "email": email}

@app.post("/admin/students/{email}/reset")
def admin_reset_student_violations(email: str, authorization: str = Header(None)):
    token = os.environ.get("ADMIN_TOKEN")
    if not authorization or authorization != f"Bearer {token}":
        raise HTTPException(403, "Unauthorized")

    copied, _ = count_student_violations(email)
    users_collection.update_one(
        {"email": email, "role": "student"},
        {"$set": {"violation_adjustment": copied, "blocked_submissions_remaining": 0}}
    )
    return {"message": "Violations reset", "email": email}

# ========================
# FRONTEND SERVING
# NOTE: Keep this section at the end so API routes are matched first.
# ========================
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
BUILT_FRONTEND = os.path.join(FRONTEND_DIR, "dist")
FRONTEND_INDEX = os.path.join(BUILT_FRONTEND, "index.html")

@app.get("/favicon.ico")
def favicon():
    path = os.path.join(FRONTEND_DIR, "public", "AiA.png")
    if os.path.exists(path):
        return FileResponse(path, media_type="image/png")
    from fastapi import Response
    return Response(status_code=204)

@app.middleware("http")
async def spa_fallback_middleware(request, call_next):
    path = request.url.path

    api_prefixes = ("/submit", "/teacher", "/student", "/admin", "/auth", "/get-student", "/docs", "/redoc", "/openapi.json")
    if path.startswith(api_prefixes):
        return await call_next(request)

    if os.path.exists(FRONTEND_INDEX):
        candidate_path = os.path.join(BUILT_FRONTEND, path.lstrip("/"))

        # Serve built assets directly so Vite chunk URLs continue to work.
        if path != "/" and os.path.isfile(candidate_path):
            return FileResponse(candidate_path)

        # All other browser routes should load the SPA entrypoint.
        return FileResponse(FRONTEND_INDEX)

    return await call_next(request)

@app.get("/{full_path:path}")
def frontend_spa(full_path: str = ""):
    if os.path.exists(FRONTEND_INDEX):
        candidate_path = os.path.join(BUILT_FRONTEND, full_path)

        # Serve real build assets directly so Vite chunk URLs keep working.
        if full_path and os.path.isfile(candidate_path):
            return FileResponse(candidate_path)

        return FileResponse(FRONTEND_INDEX)

    return {
        "message": "Frontend not built. Run: cd frontend && npm run dev",
        "frontend_dev_url": "http://localhost:8081"
    }

print("🚀 Backend Started Successfully!")
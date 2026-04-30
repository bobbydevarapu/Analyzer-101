from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os

# Load environment variables from .env file (if present)
load_dotenv()

# Use package-relative imports so the app can be started from project root
from .core.similarity import compare
from .core.decision import classify
from .database import submissions_collection, results_collection
from .utils.file_utils import extract_text
from .utils.email_utils import send_email, logger as email_logger

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


# ========================
# 🔹 SUBMIT
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

    # 🚨 PREVENT DUPLICATE
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
# 🔹 ANALYZE
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

    for i in range(len(students)):
        row = []
        for j in range(len(students)):
            if i == j:
                row.append(100)
            else:
                res = compare(students[i]["text"], students[j]["text"])
                row.append(res["final_score"])
        matrix.append(row)

    for i in range(len(students)):
        for j in range(i + 1, len(students)):
            res = compare(students[i]["text"], students[j]["text"])
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
    # list of student roll numbers for frontend rendering
    student_rolls = [s.get("roll") for s in students]

    results_collection.update_one(
        {"assignment_id": assignment_id},
        {"$set": {"matrix": matrix, "results": results}},
        upsert=True
    )

    # Persist students list in results document and return it for UI
    results_collection.update_one(
        {"assignment_id": assignment_id},
        {"$set": {"students": student_rolls}},
        upsert=True
    )

    return {
        "total_students": len(students),
        "students": student_rolls,
        "matrix": matrix,
        "results": results
    }


# ========================
# 🔹 SEND EMAIL (FIXED)
# ========================
@app.post("/send/{assignment_id}")
def send(assignment_id: str):

    data = results_collection.find_one({"assignment_id": assignment_id}, {"_id": 0})

    if not data:
        return {"error": "No results found"}

    email_logger.info(f"Send invoked for assignment_id={assignment_id}")
    # If there are no flagged results, return a clear message indicating
    # all documents are unique so the UI can display the proper text.
    if not data.get("results"):
        email_logger.info(f"No flagged results for assignment_id={assignment_id} — nothing to send")
        return {
            "message": "No flagged submissions: all documents appear unique.",
            "sent_count": 0,
        }
    sent = set()
    failures = []

    for r in data.get("results", []):
        for email in [r.get("email1"), r.get("email2")]:

            if not email or email in sent:
                continue

            # Build a more professional HTML email and subject
            subject = f"Assignment Integrity Notification — {assignment_id}"

            recipient_local = (email.split('@')[0] if email and '@' in email else 'Student')
            recipient_name = recipient_local.replace('.', ' ').replace('_', ' ').title()

            html_body = f"""
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width:700px; line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:20px 0;">
        <h2 style="margin:0;color:#111827;font-size:24px;font-weight:700;">Assignment Integrity Notification</h2>
        <p style="margin:6px 0 0;color:#6b7280;font-size:14px;">Automated notification from Assignment Integrity Analyzer</p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 0;">
        <p style="margin:0 0 12px 0;">Dear {recipient_name},</p>
        <p style="margin:0 0 16px 0;">We have completed the integrity review for assignment <strong>{assignment_id}</strong>. Our analysis indicates a potential similarity concern for your submission.</p>
        <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:16px 0;">
          <tr style="border-bottom:1px solid #e5e7eb;background:#f3f4f6;">
            <td style="padding:14px 16px;font-weight:700;color:#111827;width:50%;font-size:13px;">Similarity Score</td>
            <td style="padding:14px 16px;font-weight:700;color:#dc2626;font-size:13px;">{r.get('score')}%</td>
          </tr>
          <tr style="background:#ffffff;">
            <td style="padding:14px 16px;font-weight:700;color:#111827;font-size:13px;">Status</td>
            <td style="padding:14px 16px;color:#dc2626;font-weight:700;font-size:13px;">{r.get('status')}</td>
          </tr>
        </table>
        <p style="margin:0 0 12px 0;">Please contact your instructor to discuss this finding. If you believe this notification is in error, reply with any supporting information or evidence.</p>
        <p style="margin:0;">Kind regards,<br/><strong>Course Integrity Team</strong><br/><small style="color:#6b7280;font-size:12px;">Assignment Integrity Analyzer</small></p>
      </td>
    </tr>
    <tr>
      <td style="padding-top:12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
        <p style="margin:8px 0 0;">This is an automated message — do not reply to this address. For questions contact the instructor or the course administrator.</p>
      </td>
    </tr>
  </table>
</div>
"""

            try:
                email_logger.info(f"Attempting send to={email} for assignment_id={assignment_id}")
                status = send_email(email, subject, html_body)
                sent.add(email)
                email_logger.info(f"Send success to={email} status={status}")
            except Exception as e:
                email_logger.error(f"Send failed to={email} error={e}")
                failures.append({"email": email, "error": str(e)})

    if failures:
        email_logger.info(f"Send completed with failures assignment_id={assignment_id} sent={len(sent)} failures={len(failures)}")
        return {
            "message": "Emails sent with some failures",
            "sent_count": len(sent),
            "failures": failures,
        }

    email_logger.info(f"Send completed successfully assignment_id={assignment_id} sent={len(sent)}")
    return {"message": "Emails sent successfully", "sent_count": len(sent)}


# ========================
# 🔹 DELETE
# ========================
@app.delete("/delete/{assignment_id}")
def delete_assignment(assignment_id: str, authorization: str = Header(None)):

    # Require admin token in Authorization header: 'Bearer <TOKEN>'
    admin_token = __import__("os").environ.get("ADMIN_TOKEN")

    if not admin_token:
        raise HTTPException(status_code=403, detail="Admin token not configured on server")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]

    if token != admin_token:
        raise HTTPException(status_code=403, detail="Invalid admin token")

    sub = submissions_collection.delete_many({"assignment_id": assignment_id})
    res = results_collection.delete_many({"assignment_id": assignment_id})

    if sub.deleted_count == 0 and res.deleted_count == 0:
        return {"error": "Assignment not found"}

    return {"message": "Deleted successfully", "submissions_deleted": sub.deleted_count, "results_deleted": res.deleted_count}


@app.post("/admin/login")
def admin_login(username: str = Form(...), password: str = Form(...)):
    """Simple admin login that returns a bearer token when credentials match environment variables.

    Requires environment variables: ADMIN_USER, ADMIN_PASS, ADMIN_TOKEN
    """
    import os

    admin_user = os.environ.get("ADMIN_USER")
    admin_pass = os.environ.get("ADMIN_PASS")
    admin_token = os.environ.get("ADMIN_TOKEN")

    if not (admin_user and admin_pass and admin_token):
        raise HTTPException(status_code=503, detail="Admin auth not configured on server")

    if username == admin_user and password == admin_pass:
        return {"token": admin_token}

    raise HTTPException(status_code=401, detail="Invalid admin credentials")


# Serve the frontend from the same Render web service.
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
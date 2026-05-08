from fastapi import APIRouter, Form
from fastapi import HTTPException, UploadFile, File
import re
from datetime import datetime, timedelta
from uuid import uuid4

from ..database import (
    submissions_collection,
    results_collection,
    users_collection,
    secret_keys_collection,
    tests_collection,
    live_tests_collection,
)
import os

from ..services.analysis_service import run_analysis
from ..utils.email_utils import send_email
from ..utils.file_utils import extract_text
import io

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher"]
)


@router.post("/upload-test")
async def teacher_upload_test(
    question_file: UploadFile = File(...),
    answer_file: UploadFile | None = File(None),
    teacher_email: str = Form(...),
    title: str = Form(None)
):
    """Accepts question and optional answer files, performs a lightweight MCQ detection.

    This is a heuristic check (client-side files only). It returns `is_mcq` boolean
    and a message. Later this can be extended to store files or run a robust parser.
    """

    try:
        # read bytes (used for saving) and also extract readable text
        raw = await question_file.read()

        # prepare a file-like object for extract_text
        temp = type("F", (), {})()
        temp.filename = question_file.filename
        temp.file = io.BytesIO(raw)

        try:
            text = extract_text(temp)
        except Exception:
            # fallback: try naive decoding
            try:
                text = raw.decode("utf-8")
            except Exception:
                try:
                    text = raw.decode("latin-1")
                except Exception:
                    text = ""

        # simple heuristics: look for option patterns like 'a)', 'a.', '(a)', 'A)', 'A.' or numbered '1.' with choices
        # improve robustness: fix regex escapes and also check the answer file (if provided)
        patterns = [r"\b[a-dA-D][\)\.]\s", r"\([a-dA-D]\)", r"\b\d+\.\s", r"\b[A-D]\.\s"]
        count = 0
        for p in patterns:
            try:
                matches = re.findall(p, text)
            except re.error:
                matches = []
            if matches:
                count += len(matches)

        # also check answer file for option markers (helps when questions are scanned separately)
        if answer_file:
            try:
                a_raw = await answer_file.read()
                temp_a = type("F", (), {})()
                temp_a.filename = answer_file.filename
                temp_a.file = io.BytesIO(a_raw)
                try:
                    a_text = extract_text(temp_a)
                except Exception:
                    try:
                        a_text = a_raw.decode("utf-8")
                    except Exception:
                        try:
                            a_text = a_raw.decode("latin-1")
                        except Exception:
                            a_text = ""

                for p in patterns:
                    try:
                        matches = re.findall(p, a_text)
                    except re.error:
                        matches = []
                    if matches:
                        count += len(matches)
            finally:
                # rewind answer_file for any future reads
                try:
                    answer_file.file.seek(0)
                except Exception:
                    pass

        # choose a lower threshold to be more permissive for scanned PDFs
        is_mcq = count >= 2

        message = "MCQ detected" if is_mcq else "No clear MCQ pattern found"

        # persist test metadata and save files to uploads/<test_id>/
        test_id = f"T-{uuid4().hex[:8]}"
        uploads_root = os.path.join(os.getcwd(), "uploads")
        os.makedirs(uploads_root, exist_ok=True)
        test_dir = os.path.join(uploads_root, test_id)
        os.makedirs(test_dir, exist_ok=True)

        q_filename = f"{test_id}_{question_file.filename}"
        q_path = os.path.join(test_dir, q_filename)
        with open(q_path, "wb") as fh:
            fh.write(raw)

        a_path = None
        a_filename = None
        if answer_file:
            a_raw = await answer_file.read()
            a_filename = f"{test_id}_{answer_file.filename}"
            a_path = os.path.join(test_dir, a_filename)
            with open(a_path, "wb") as fh:
                fh.write(a_raw)

        test_doc = {
            "test_id": test_id,
            "title": title or question_file.filename,
            "question_filename": q_filename,
            "question_path": q_path,
            "answer_filename": a_filename,
            "answer_path": a_path,
            "created_by": teacher_email,
            "is_mcq": is_mcq,
            "status": "UPCOMING" if is_mcq else "DRAFT",
            "created_at": datetime.utcnow()
        }

        # generate short access codes for student submissions/joining
        access_codes = [uuid4().hex[:6].upper() for _ in range(20)]
        test_doc["access_codes"] = access_codes

        tests_collection.insert_one(test_doc)

        expires_at = datetime.utcnow() + timedelta(hours=2)
        live_tests_collection.update_one(
            {"test_id": test_id},
            {
                "$set": {
                    "test_id": test_id,
                    "subject": (title or question_file.filename or "General").split("-")[0].strip() or "General",
                    "duration": 45,
                    "questions": [
                        {
                            "question_id": 1,
                            "question": "What is AWS?",
                            "options": ["A cloud provider", "A text editor", "A hardware router", "A compiler"],
                            "correct": "A cloud provider",
                        }
                    ],
                    "answers": [{"question_id": 1, "correct": "A cloud provider"}],
                    "created_by": teacher_email,
                    "expires_at": expires_at.isoformat() + "Z",
                    "access_codes": access_codes,
                }
            },
            upsert=True,
        )

        return {
            "is_mcq": is_mcq,
            "message": message,
            "test_id": test_id,
            "title": test_doc["title"],
            "question_filename": q_filename,
            "answer_filename": a_filename,
            "access_codes": access_codes,
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


def build_violation_email(
    assignment_id: str,
    student_roll: str,
    score,
    status,
    teacher_email: str = None
):

    return f"""
<div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px;color:#0f172a;line-height:1.6">

<div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.08)">

<div style="background:linear-gradient(135deg,#0f172a 0%,#111827 52%,#1f2937 100%);padding:28px 32px;color:#ffffff">

<div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#fbbf24;margin-bottom:10px">
Assignment Integrity Analyzer
</div>

<h1 style="margin:0;font-size:30px;line-height:1.2;">
Academic Integrity Review Notice
</h1>

</div>

<div style="padding:32px">

<p style="margin:0 0 16px 0;">Dear {student_roll or 'Student'},</p>

<p style="margin:0 0 24px 0;color:#334155;">
Our system identified a similarity concern in one of the submitted responses for the assignment below. This notice is being shared with you so you can review the matter and contact your instructor for clarification.
</p>

<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px 20px;margin-bottom:24px">

<table style="width:100%;border-collapse:collapse;font-size:14px">

<tr>
<td style="padding:10px 0;color:#64748b;width:42%;">Assignment</td>
<td style="padding:10px 0;font-weight:700;color:#0f172a;">{assignment_id}</td>
</tr>

<tr>
<td style="padding:10px 0;color:#64748b;">Similarity Score</td>
<td style="padding:10px 0;font-weight:700;color:#b91c1c;">{score}%</td>
</tr>

<tr>
<td style="padding:10px 0;color:#64748b;">Status</td>
<td style="padding:10px 0;font-weight:700;color:#0f172a;">{status}</td>
</tr>

</table>

</div>

<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:16px 18px;color:#9a3412;font-size:13px;margin-bottom:24px">
📋 Please review this notification carefully. If you have questions or believe this is an error, contact your instructor.
</div>

{"<div style='background:#f0f9ff;border:1px solid #bae6fd;border-radius:14px;padding:16px 18px;color:#0369a1;font-size:13px;margin-bottom:24px'><strong>Instructor:</strong> " + teacher_email + "</div>" if teacher_email else ""}

<p style="margin:0;color:#666;font-size:12px;margin-top:24px">
This is an automated message from the Assignment Integrity Analyzer. Do not reply to this email.
</p>

</div>

<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;font-size:11px;color:#64748b">
<p style="margin:0">© 2026 Assignment Integrity Analyzer. All rights reserved.</p>
</div>

</div>

</div>
"""


@router.post("/analyze")
def teacher_analyze(
    assignment_id: str = Form(...),
    teacher_email: str = Form(...)
):
    result = run_analysis(
        assignment_id=assignment_id,
        created_by=teacher_email
    )

    return {
        **result,
        "message": f"Analysis complete for {assignment_id}"
    }


@router.post("/publish-test")
def teacher_publish_test(
    test_id: str = Form(...),
    teacher_email: str = Form(...),
    title: str | None = Form(None),
):
    """Publish a previously uploaded test (promote from DRAFT to UPCOMING).

    This endpoint allows the teacher to set a visible title and mark the test as ready.
    """
    test_doc = tests_collection.find_one({"test_id": test_id})
    if not test_doc:
        raise HTTPException(404, "Test not found")

    if test_doc.get("created_by") != teacher_email:
        raise HTTPException(403, "Only the creator can publish this test")

    new_status = "UPCOMING"
    update_fields = {"status": new_status}
    if title:
        update_fields["title"] = title

    tests_collection.update_one({"test_id": test_id}, {"$set": update_fields})

    # ensure live_tests_collection has matching metadata
    live_tests_collection.update_one({"test_id": test_id}, {"$set": {"subject": (title or test_doc.get("title") or "General"), "published": True}}, upsert=True)

    # return basic info including access codes
    updated = tests_collection.find_one({"test_id": test_id}, {"_id": 0})

    return {
        "message": "Test published",
        "test_id": test_id,
        "title": updated.get("title"),
        "access_codes": updated.get("access_codes", []),
        "status": updated.get("status"),
    }


@router.get("/reports")
def teacher_reports(teacher_email: str):

    reports = list(results_collection.find(
        {"created_by": teacher_email},
        {"_id": 0}
    ))

    return {"reports": reports}


@router.get("/violations")
def teacher_violations(
    teacher_email: str
):

    reports = list(
        results_collection.find(
            {
                "created_by": teacher_email
            },
            {
                "_id": 0
            }
        ).sort(
            "created_at",
            -1
        )
    )

    violations = []

    total_high_risk = 0
    total_medium_risk = 0

    for report in reports:

        assignment_id = report.get(
            "assignment_id",
            "UNKNOWN"
        )

        created_at = report.get(
            "created_at"
        )

        results = report.get(
            "results",
            []
        )

        for pair in results:

            score = pair.get(
                "score",
                0
            )

            status = pair.get(
                "status",
                "Normal"
            )

            violation_item = {

                "assignment_id":
                    assignment_id,

                "student1":
                    pair.get("student1"),

                "student2":
                    pair.get("student2"),

                "email1":
                    pair.get("email1"),

                "email2":
                    pair.get("email2"),

                "score":
                    score,

                "status":
                    status,

                "created_at":
                    created_at,
            }

            violations.append(
                violation_item
            )

            if status == "High Risk":

                total_high_risk += 1

            elif status == "Medium Risk":

                total_medium_risk += 1

    violations.sort(
        key=lambda item: item.get(
            "score",
            0
        ),
        reverse=True
    )

    return {

        "total":
            len(violations),

        "high_risk":
            total_high_risk,

        "medium_risk":
            total_medium_risk,

        "violations":
            violations,
    }


@router.post("/send/{assignment_id}")
def teacher_send(
    assignment_id: str,
    teacher_email: str = Form(None)
):

    import logging

    logger = logging.getLogger("teacher_send")

    if not logger.handlers:

        stream_handler = logging.StreamHandler()

        stream_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s %(message)s"
            )
        )

        logger.addHandler(stream_handler)

    logger.setLevel(logging.INFO)

    data = None

    if teacher_email:

        data = results_collection.find_one(
            {
                "assignment_id": assignment_id,
                "created_by": teacher_email
            },
            {
                "_id": 0
            }
        )

    if not data:

        data = results_collection.find_one(
            {
                "assignment_id": assignment_id
            },
            {
                "_id": 0
            }
        )
        # Get teacher email from found data if not provided
        if data and not teacher_email:
            teacher_email = data.get("created_by")

    if not data:

        logger.error(f"🔴 Report not found for {assignment_id}")

        return {
            "message": "Report not found",
            "sent_count": 0,
            "failed_count": 0,
            "failed": []
        }

    results = data.get("results", [])

    logger.info(f"🔍 Found {len(results)} flagged pairs for {assignment_id}")

    if not results:

        logger.warning(f"⚠️ No flagged pairs found for {assignment_id}")

        return {
            "message": "No copied students found",
            "sent_count": 0,
            "failed_count": 0,
            "failed": []
        }

    sent = []
    failed = []

    for idx, pair in enumerate(results):

        recipients = [

            (
                pair.get("student1"),
                pair.get("email1")
            ),

            (
                pair.get("student2"),
                pair.get("email2")
            )
        ]

        logger.info(f"📧 Pair {idx}: student1={pair.get('student1')} email1={pair.get('email1')} | student2={pair.get('student2')} email2={pair.get('email2')}")

        for student_roll, email in recipients:

            # Fallback for older analysis records that don't store email1/email2.
            # Try users collection first, then assignment submissions.
            if not email and student_roll:
                user_doc = users_collection.find_one(
                    {"roll": student_roll},
                    {"_id": 0, "email": 1}
                )
                if user_doc and user_doc.get("email"):
                    email = user_doc.get("email")
                    logger.info(f"   🔎 Resolved email from users_collection for {student_roll}: {email}")

            if not email and student_roll:
                sub_doc = submissions_collection.find_one(
                    {
                        "assignment_id": assignment_id,
                        "roll": student_roll
                    },
                    {"_id": 0, "email": 1}
                )
                if sub_doc and sub_doc.get("email"):
                    email = sub_doc.get("email")
                    logger.info(f"   🔎 Resolved email from submissions_collection for {student_roll}: {email}")

            logger.info(f"   📬 Processing student={student_roll} email={email}")

            if not email:

                logger.warning(f"⚠️ No email found for {student_roll}")

                failed.append({"student": student_roll,"error": "No email found"})

                continue

            try:

                body = build_violation_email(
                    assignment_id=assignment_id,
                    student_roll=student_roll,
                    score=pair.get("score"),
                    status=pair.get("status"),
                    teacher_email=teacher_email
                )

                email_result = send_email(
                    email,
                    f"Assignment Integrity Alert | {assignment_id}",
                    body
                )

                if email_result:

                    logger.info(
                        f"✅ EMAIL SENT → {email}"
                    )

                    sent.append(email)

                else:

                    logger.error(
                        f"❌ EMAIL FAILED → {email}"
                    )

                    failed.append({
                        "email": email,
                        "error": "SendGrid returned failure"
                    })

            except Exception as exc:

                logger.error(
                    f"❌ EMAIL FAILED → {email} → {exc}"
                )

                failed.append({
                    "email": email,
                    "error": str(exc)
                })


    logger.info(f"📊 Summary: {len(sent)} sent, {len(failed)} failed")

    # Build correct message based on results
    if len(sent) > 0 and len(failed) == 0:
       message = f"All emails sent successfully ({len(sent)})"
       
    elif len(sent) > 0 and len(failed) > 0:
       message = (
        f"Partial success: "
        f"{len(sent)} sent, "
        f"{len(failed)} failed"
        )
       
    elif len(failed) > 0:
        message = (
        f"All email sends failed "
        f"({len(failed)} attempted)"
        )
    else:
       message = (
        "No emails to send")

    return {
        "message": message,
        "sent_count": len(sent),
        "failed_count": len(failed),
        "sent": sent,
        "failed": failed,
    }


@router.get("/diagnostic")
def teacher_diagnostic():

    return {
        "status": "ok",
        "sendgrid_configured": bool(
            os.getenv("SENDGRID_API_KEY")
        ),
        "from_email": os.getenv("FROM_EMAIL"),
    }


@router.post("/ban")
def teacher_ban(
    student_email: str = Form(...),
    teacher_email: str = Form(...),
    count: int = Form(5)
):

    users_collection.update_one(
        {
            "email": student_email
        },
        {
            "$set": {
                "blocked_submissions_remaining": count
            }
        },
        upsert=True
    )

    return {
        "message":
            f"Student {student_email} restricted"
    }


@router.post("/secret-key")
def teacher_secret_key(
    teacher_email: str = Form(...),
    expires_in_minutes: int = Form(15)
):

    key = str(uuid4())

    expires_at = datetime.utcnow() + timedelta(
        minutes=expires_in_minutes
    )

    secret_keys_collection.insert_one({

        "key": key,

        "created_by": teacher_email,

        "created_at": datetime.utcnow(),

        "expires_at": expires_at
    })

    return {

        "key": key,

        "expires_at":
            expires_at.isoformat() + "Z",

        "expires_in_minutes":
            expires_in_minutes
    }
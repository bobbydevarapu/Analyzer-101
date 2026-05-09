from fastapi import (
    APIRouter,
    Form,
    Header,
    HTTPException,
)

from datetime import datetime

from ..database import (
    submissions_collection,
    results_collection,
    live_tests_collection,
    users_collection,
)

from ..core.similarity import (
    compare,
    get_embeddings,
)

from ..core.decision import classify
from ..utils.email_utils import send_email

router = APIRouter(
    prefix="/teacher",
    tags=["Teacher Analysis"]
)

# =========================================================
# DASHBOARD STATS
# =========================================================

@router.get("/dashboard")
def teacher_dashboard(
    authorization: str = Header(None)
):

    assignments = list(
        results_collection.find(
            {},
            {"_id": 0}
        )
    )

    submissions = list(
        submissions_collection.find(
            {},
            {"_id": 0}
        )
    )

    live_tests = list(
        live_tests_collection.find(
            {},
            {"_id": 0}
        )
    )

    unique_students = set()

    for item in submissions:

        roll = item.get("roll")

        if roll:
            unique_students.add(
                roll
            )

    total_violations = 0

    for assignment in assignments:

        total_violations += len(
            assignment.get(
                "results",
                []
            )
        )

    return {

        "assignments":
            len(assignments),

        "students":
            len(unique_students),

        "violations":
            total_violations,

        "live_tests":
            len(live_tests),
    }

# =========================================================
# ANALYZE ASSIGNMENT
# =========================================================

@router.post("/analyze")
def analyze_assignment(

    assignment_id: str = Form(...),

    teacher_email: str = Form(None),

    authorization: str = Header(None)
):

    assignment_id = (
        assignment_id
        .strip()
        .upper()
    )

    students = list(
        submissions_collection.find(
            {
                "assignment_id":
                    assignment_id
            },
            {
                "_id": 0
            }
        )
    )

    if len(students) < 2:

        raise HTTPException(
            status_code=400,
            detail="Need at least 2 submissions"
        )

    # =========================================================
    # EXTRACT TEXTS
    # =========================================================

    texts = [
        student["text"]
        for student in students
    ]

    embeddings = get_embeddings(
        texts
    )

    matrix = []

    results = []

    # =========================================================
    # GENERATE MATRIX
    # =========================================================

    for i in range(len(students)):

        row = []

        for j in range(len(students)):

            if i == j:

                row.append(100)

            else:

                similarity = compare(

                    students[i]["text"],
                    students[j]["text"],

                    embeddings[i],
                    embeddings[j],
                )

                row.append(
                    round(
                        similarity["final_score"],
                        2
                    )
                )

        matrix.append(row)

    # =========================================================
    # DETECT VIOLATIONS
    # =========================================================

    for i in range(len(students)):

        for j in range(i + 1, len(students)):

            similarity = compare(

                students[i]["text"],
                students[j]["text"],

                embeddings[i],
                embeddings[j],
            )

            final = classify(
                similarity
            )

            if final["status"] != "Normal":

                results.append({

                    "student1":
                        students[i]["roll"],

                    "student2":
                        students[j]["roll"],

                    "score":
                        round(
                            similarity["final_score"],
                            2
                        ),

                    "status":
                        final["status"],

                    "email1":
                        students[i]["email"],

                    "email2":
                        students[j]["email"],
                })

    # =========================================================
    # STUDENT LIST
    # =========================================================

    student_rolls = [

        student.get("roll")

        for student in students
    ]

    # =========================================================
    # FINAL DOCUMENT
    # =========================================================

    document = {

        "assignment_id":
            assignment_id,

        "created_by":
            teacher_email,

        "created_at":
            datetime.utcnow().isoformat() + "Z",

        "total_students":
            len(students),

        "students":
            student_rolls,

        "matrix":
            matrix,

        "results":
            results,
    }

    # =========================================================
    # SAVE REPORT
    # =========================================================

    results_collection.update_one(

        {
            "assignment_id":
                assignment_id
        },

        {
            "$set":
                document
        },

        upsert=True,
    )

    # =========================================================
    # RETURN RESPONSE
    # =========================================================

    return {

        "assignment_id":
            assignment_id,

        "created_by":
            teacher_email,

        "created_at":
            document["created_at"],

        "total_students":
            len(students),

        "students":
            student_rolls,

        "matrix":
            matrix,

        "results":
            results,

        "message":
            f"Analysis complete for {assignment_id}"
    }

# =========================================================
# GET TEACHER REPORTS
# =========================================================

@router.get("/reports/{teacher_email}")
def teacher_reports(
    teacher_email: str
):

    reports = list(

        results_collection.find(

            {
                "created_by":
                    teacher_email
            },

            {
                "_id": 0
            }

        ).sort(
            "created_at",
            -1
        )
    )

    return {
        "reports":
            reports
    }

# =========================================================
# GET SINGLE REPORT
# =========================================================

@router.get("/report/{assignment_id}")
def get_single_report(
    assignment_id: str
):

    assignment_id = (
        assignment_id
        .strip()
        .upper()
    )

    report = results_collection.find_one(

        {
            "assignment_id":
                assignment_id
        },

        {
            "_id": 0
        }
    )

    if not report:

        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return report

# =========================================================
# DELETE REPORT
# =========================================================

@router.delete("/report/{assignment_id}")
def delete_report(
    assignment_id: str
):

    assignment_id = (
        assignment_id
        .strip()
        .upper()
    )

    deleted = results_collection.delete_one(
        {
            "assignment_id":
                assignment_id
        }
    )

    if deleted.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    return {
        "message":
            "Report deleted successfully"
    }

# =========================================================
# SEND EMAILS
# =========================================================

def build_violation_email(
        assignment_id: str,
        student_roll: str,
        score,
        status,
        teacher_email: str | None = None,
):
        try:
                score_value = f"{float(score):.1f}%"
        except (TypeError, ValueError):
                score_value = f"{score}%"

        status_value = status or "Highly Similar"
        teacher_value = teacher_email or "Not provided"

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
        @media only screen and (max-width: 600px) {{
            .email-shell {{ padding: 12px !important; }}
            .email-card {{ border-radius: 16px !important; }}
            .email-header {{ padding: 22px 18px !important; }}
            .email-title {{ font-size: 24px !important; line-height: 1.15 !important; }}
            .email-body {{ padding: 20px 16px !important; }}
            .email-label, .email-value {{ display: block !important; width: 100% !important; }}
            .email-label {{ padding: 10px 0 4px 0 !important; }}
            .email-value {{ padding: 0 0 12px 0 !important; }}
            .email-row {{ display: block !important; }}
            .email-table {{ border-spacing: 0 !important; }}
            .email-note, .email-instructor {{ font-size: 13px !important; line-height: 1.55 !important; }}
        }}
    </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;color:#0f172a;font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
    <div class="email-shell" style="padding:24px;">
        <div class="email-card" style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,.08);">
            <div class="email-header" style="background:linear-gradient(135deg,#0f172a 0%,#111827 52%,#1f2937 100%);padding:28px 32px;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#fbbf24;margin-bottom:10px;">Assignment Integrity Analyzer</div>
                <h1 class="email-title" style="margin:0;font-size:30px;line-height:1.2;">Academic Integrity Review Notice</h1>
            </div>

            <div class="email-body" style="padding:32px;">
                <p style="margin:0 0 16px 0;font-size:15px;">Dear {student_roll or 'Student'},</p>

                <p style="margin:0 0 24px 0;color:#334155;font-size:15px;">
                    Our system identified a similarity concern in one of the submitted responses for the assignment below. This notice is being shared with you so you can review the matter and contact your instructor for clarification.
                </p>

                <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#f8fafc;">
                    <div style="padding:14px 18px;background:#eef2ff;color:#334155;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;">Results Summary</div>
                    <table class="email-table" role="presentation" style="width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;">
                        <tr class="email-row">
                            <td class="email-label" style="width:38%;padding:14px 18px;border-top:1px solid #e2e8f0;color:#64748b;font-size:14px;">Assignment</td>
                            <td class="email-value" style="padding:14px 18px;border-top:1px solid #e2e8f0;font-size:15px;font-weight:700;color:#0f172a;word-break:break-word;">{assignment_id}</td>
                        </tr>
                        <tr class="email-row">
                            <td class="email-label" style="width:38%;padding:14px 18px;border-top:1px solid #e2e8f0;color:#64748b;font-size:14px;">Similarity Score</td>
                            <td class="email-value" style="padding:14px 18px;border-top:1px solid #e2e8f0;font-size:15px;font-weight:700;color:#b91c1c;word-break:break-word;">{score_value}</td>
                        </tr>
                        <tr class="email-row">
                            <td class="email-label" style="width:38%;padding:14px 18px;border-top:1px solid #e2e8f0;color:#64748b;font-size:14px;">Status</td>
                            <td class="email-value" style="padding:14px 18px;border-top:1px solid #e2e8f0;font-size:15px;font-weight:700;color:#0f172a;word-break:break-word;">{status_value}</td>
                        </tr>
                    </table>
                </div>

                <div class="email-note" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:16px 18px;color:#9a3412;font-size:13px;margin-bottom:20px;">
                    Please review this notification carefully. If you have questions or believe this is an error, contact your instructor.
                </div>

                <div class="email-instructor" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:14px;padding:16px 18px;color:#0369a1;font-size:13px;margin-bottom:24px;word-break:break-word;">
                    <strong>Instructor:</strong> {teacher_value}
                </div>

                <p style="margin:0;color:#64748b;font-size:12px;">This is an automated message from the Assignment Integrity Analyzer. Do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

@router.post("/send/{assignment_id}")
def send_emails(
    assignment_id: str
):

    assignment_id = (
        assignment_id
        .strip()
        .upper()
    )

    report = results_collection.find_one(
        {
            "assignment_id":
                assignment_id
        }
    )

    if not report:

        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    violations = report.get(
        "results",
        []
    )

    if len(violations) == 0:

        return {
            "message":
                "No violations found"
        }

    teacher_email = report.get("created_by")

    sent = []
    failed = []

    for pair in violations:
        recipients = [
            (pair.get("student1"), pair.get("email1")),
            (pair.get("student2"), pair.get("email2")),
        ]

        for student_roll, email in recipients:
            if not email and student_roll:
                user_doc = users_collection.find_one(
                    {"roll": student_roll},
                    {"_id": 0, "email": 1},
                )
                if user_doc and user_doc.get("email"):
                    email = user_doc.get("email")

            if not email and student_roll:
                sub_doc = submissions_collection.find_one(
                    {"assignment_id": assignment_id, "roll": student_roll},
                    {"_id": 0, "email": 1},
                )
                if sub_doc and sub_doc.get("email"):
                    email = sub_doc.get("email")

            if not email:
                failed.append({"student": student_roll, "error": "No email found"})
                continue

            body = build_violation_email(
                assignment_id=assignment_id,
                student_roll=student_roll,
                score=pair.get("score"),
                status=pair.get("status"),
                teacher_email=teacher_email,
            )

            ok = send_email(
                email,
                f"Assignment Integrity Alert | {assignment_id}",
                body,
            )

            if ok:
                sent.append(email)
            else:
                failed.append({"email": email, "error": "SendGrid returned failure"})

    if sent and not failed:
        message = f"All emails sent successfully ({len(sent)})"
    elif sent and failed:
        message = f"Partial success: {len(sent)} sent, {len(failed)} failed"
    elif failed:
        message = f"All email sends failed ({len(failed)} attempted)"
    else:
        message = "No emails to send"

    return {
        "message": message,
        "violations": len(violations),
        "sent_count": len(sent),
        "failed_count": len(failed),
        "sent": sent,
        "failed": failed,
    }

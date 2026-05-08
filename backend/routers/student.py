import os
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

from ..auth.auth_utils import hash_password, verify_jwt
from ..database import (
	live_tests_collection,
	results_collection,
	submissions_collection,
	test_submissions_collection,
	users_collection,
)
from ..utils.file_utils import extract_text

router = APIRouter(prefix="/student", tags=["Student"])

MAX_UPLOAD_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_VIOLATIONS = int(os.environ.get("MAX_VIOLATIONS", "10"))


class JoinTestPayload(BaseModel):
	email: str
	test_id: str


class StudentAnswer(BaseModel):
	question_id: int
	selected: str


class SubmitTestPayload(BaseModel):
	email: str
	test_id: str
	answers: list[StudentAnswer] = Field(default_factory=list)
	violations: int = 0


class UpdateProfilePayload(BaseModel):
	email: str
	phone: str | None = None
	photo: str | None = None
	password: str | None = None


class UpdateSettingsPayload(BaseModel):
	email: str
	darkMode: bool | None = None
	notifications: bool | None = None
	language: str | None = None


def _normalize_email(email: str) -> str:
	return email.strip().lower()


def _to_iso_string(value):
	if isinstance(value, datetime):
		return value.isoformat()
	if value is None:
		return datetime.utcnow().isoformat() + "Z"
	return str(value)


def _validate_student_token(authorization: str | None, email: str):
	if not authorization or not authorization.startswith("Bearer "):
		raise HTTPException(401, "Missing or invalid authorization header")

	token = authorization.split(" ", 1)[1].strip()

	try:
		payload = verify_jwt(token)
	except ValueError as exc:
		raise HTTPException(401, str(exc)) from exc

	token_email = _normalize_email(payload.get("sub", ""))
	requested_email = _normalize_email(email)

	if payload.get("role") != "student":
		raise HTTPException(403, "Only student tokens are allowed")

	if token_email != requested_email:
		raise HTTPException(403, "Token/email mismatch")


def _grade_from_percentage(percentage: float) -> str:
	if percentage >= 90:
		return "A+"
	if percentage >= 80:
		return "A"
	if percentage >= 70:
		return "B"
	if percentage >= 60:
		return "C"
	if percentage >= 50:
		return "D"
	return "F"


def _violation_level(score: float) -> str:
	if score >= 95:
		return "Critical"
	if score >= 85:
		return "High"
	if score >= 70:
		return "Medium"
	return "Low"


def _count_student_violations(email: str):
	copied = 0
	violations = []

	for result_doc in results_collection.find({}, {"_id": 0, "assignment_id": 1, "results": 1, "created_at_dt": 1}):
		for pair in result_doc.get("results", []):
			if pair.get("email1") == email or pair.get("email2") == email:
				copied += 1
				score = float(pair.get("score") or 0)
				violations.append(
					{
						"id": f"{result_doc.get('assignment_id', 'A')}-{copied}",
						"violationType": "Assignment Similarity High",
						"date": _to_iso_string(result_doc.get("created_at_dt")),
						"status": _violation_level(score),
						"teacherRemark": f"Similarity observed around {round(score)}%.",
						"penalty": "Warning" if score < 90 else "Strict Review",
						"assignment_id": result_doc.get("assignment_id"),
						"score": score,
					}
				)

	return copied, violations


def _student_assignment_results(email: str):
	items = []

	for result_doc in results_collection.find({}, {"_id": 0, "assignment_id": 1, "results": 1, "created_at_dt": 1}):
		assignment_id = result_doc.get("assignment_id")
		for pair in result_doc.get("results", []):
			if pair.get("email1") == email or pair.get("email2") == email:
				similarity = float(pair.get("score") or 0)
				percentage = max(0.0, 100.0 - similarity)
				marks = round(percentage)
				items.append(
					{
						"id": f"assignment-{assignment_id}",
						"subject": assignment_id.split("-")[0] if assignment_id and "-" in assignment_id else "Assignment",
						"name": assignment_id or "Assignment",
						"marks": marks,
						"percentage": round(percentage, 2),
						"grade": _grade_from_percentage(percentage),
						"status": "Flagged" if similarity >= 70 else "Analyzed",
						"date": _to_iso_string(result_doc.get("created_at_dt")),
						"source": "assignment",
						"details": {
							"correct": 0,
							"wrong": 0,
							"timeTaken": 0,
							"violations": 1,
						},
					}
				)

	return items


def _student_test_results(email: str):
	items = []

	docs = test_submissions_collection.find(
		{"student_email": email},
		{"_id": 0, "test_id": 1, "score": 1, "percentage": 1, "violations": 1, "submitted_at": 1, "total_questions": 1},
	)

	for doc in docs:
		percentage = float(doc.get("percentage") or 0)
		total_q = int(doc.get("total_questions") or 0)
		score = float(doc.get("score") or 0)
		wrong = max(0, total_q - int(score))

		items.append(
			{
				"id": f"test-{doc.get('test_id', 'T')}",
				"subject": "Live Test",
				"name": doc.get("test_id", "Test"),
				"marks": int(score),
				"percentage": round(percentage, 2),
				"grade": _grade_from_percentage(percentage),
				"status": "Pass" if percentage >= 40 else "Fail",
				"date": doc.get("submitted_at") or datetime.utcnow().isoformat() + "Z",
				"source": "test",
				"details": {
					"correct": int(score),
					"wrong": wrong,
					"timeTaken": 0,
					"violations": int(doc.get("violations") or 0),
				},
			}
		)

	return items


@router.get("/dashboard")
def student_dashboard(email: str, authorization: str | None = Header(None)):
	email = _normalize_email(email)
	_validate_student_token(authorization, email)

	submissions = list(
		submissions_collection.find(
			{"email": email},
			{"_id": 0, "assignment_id": 1, "created_at": 1},
		)
	)
	assignment_results = _student_assignment_results(email)
	test_results = _student_test_results(email)
	copied, violations = _count_student_violations(email)

	total_scores = [r.get("percentage", 0) for r in assignment_results + test_results]
	avg_score = (sum(total_scores) / len(total_scores)) if total_scores else 0.0

	upcoming_tests = []
	now = datetime.now(timezone.utc)
	for test in live_tests_collection.find({}, {"_id": 0, "test_id": 1, "subject": 1, "duration": 1, "expires_at": 1}):
		expires_at = test.get("expires_at")
		exp = None
		if isinstance(expires_at, str):
			try:
				exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
			except ValueError:
				exp = None
		elif isinstance(expires_at, datetime):
			exp = expires_at

		if exp and exp > now:
			upcoming_tests.append(
				{
					"test_id": test.get("test_id", ""),
					"subject": test.get("subject", "General"),
					"date": exp.date().isoformat(),
					"time": exp.strftime("%H:%M"),
					"duration": int(test.get("duration") or 45),
					"expires_at": exp.isoformat(),
				}
			)

	activity = []
	for s in submissions[-6:]:
		activity.append(
			{
				"type": "Uploaded Assignment",
				"description": f"Submitted {s.get('assignment_id', 'assignment')}",
				"created_at": s.get("created_at") or datetime.utcnow().isoformat() + "Z",
			}
		)

	for t in test_results[-3:]:
		activity.append(
			{
				"type": "Result Published",
				"description": f"Result available for {t.get('name', 'test')}",
				"created_at": t.get("date") or datetime.utcnow().isoformat() + "Z",
			}
		)

	for v in violations[-3:]:
		activity.append(
			{
				"type": "Warning Issued",
				"description": v.get("violationType", "Integrity event"),
				"created_at": v.get("date") or datetime.utcnow().isoformat() + "Z",
			}
		)

	submission_trend = []
	for item in (assignment_results + test_results)[-10:]:
		submission_trend.append(
			{
				"assignment": item.get("name", "Item"),
				"score": round(float(item.get("percentage", 0)), 2),
			}
		)

	completed = len(submissions)
	pending = 0
	flagged = copied

	return {
		"metrics": {
			"assignments": completed,
			"submitted": completed,
			"pending": pending,
			"averageScore": round(avg_score, 2),
			"violations": copied,
			"liveTests": len(upcoming_tests),
		},
		"submissionTrend": submission_trend,
		"performancePie": [
			{"name": "Completed", "value": completed},
			{"name": "Pending", "value": pending},
			{"name": "Flagged", "value": flagged},
		],
		"recentActivity": sorted(activity, key=lambda x: _to_iso_string(x["created_at"]), reverse=True)[:8],
		"upcomingTests": upcoming_tests[:6],
	}


@router.get("/assignments")
def student_assignments(email: str, page: int = 1, page_size: int = 10, authorization: str | None = Header(None)):
	email = _normalize_email(email)
	_validate_student_token(authorization, email)
	page = max(1, page)
	page_size = min(50, max(1, page_size))

	submissions = list(
		submissions_collection.find(
			{"email": email},
			{"_id": 0, "assignment_id": 1, "dept": 1, "created_at": 1},
		).sort("created_at", -1)
	)

	items = []
	flagged_ids = {v.get("assignment_id") for v in _count_student_violations(email)[1]}
	analyzed_ids = set(results_collection.distinct("assignment_id"))

	for sub in submissions:
		assignment_id = sub.get("assignment_id", "")
		status = "Submitted"
		if assignment_id in flagged_ids:
			status = "Flagged"
		elif assignment_id in analyzed_ids:
			status = "Analyzed"

		items.append(
			{
				"assignment_id": assignment_id,
				"subject": sub.get("dept") or (assignment_id.split("-")[0] if "-" in assignment_id else "General"),
				"deadline": "-",
				"status": status,
				"can_upload": True,
				"submitted_at": sub.get("created_at"),
			}
		)

	start = (page - 1) * page_size
	end = start + page_size

	return {"items": items[start:end], "total": len(items)}


@router.post("/upload")
async def student_upload(
	assignment_id: str = Form(...),
	dept: str = Form(...),
	roll: str = Form(...),
	email: str = Form(...),
	file: UploadFile = File(...),
	authorization: str | None = Header(None),
):
	email = _normalize_email(email)
	_validate_student_token(authorization, email)
	dept = dept.strip().upper()
	roll = roll.strip().upper()
	assignment_id = assignment_id.strip().upper()

	_, violations = _count_student_violations(email)
	if len(violations) >= MAX_VIOLATIONS:
		raise HTTPException(403, "Submission blocked: violation limit reached")

	ext = os.path.splitext(file.filename or "")[1].lower()
	if ext not in ALLOWED_EXTENSIONS:
		raise HTTPException(400, "Only pdf, docx, txt files are allowed")

	file.file.seek(0, os.SEEK_END)
	size = file.file.tell()
	file.file.seek(0)

	if size > MAX_UPLOAD_SIZE:
		raise HTTPException(400, "File exceeds max size of 10MB")

	if submissions_collection.find_one({"assignment_id": assignment_id, "roll": roll}):
		raise HTTPException(400, "Already submitted")

	text = extract_text(file)
	if not text.strip():
		raise HTTPException(400, "Empty file content")

	submissions_collection.insert_one(
		{
			"assignment_id": assignment_id,
			"dept": dept,
			"roll": roll,
			"email": email,
			"text": text,
			"created_at": datetime.utcnow().isoformat() + "Z",
		}
	)

	return {"message": "Submission successful"}


@router.get("/results")
def student_results(email: str, page: int = 1, page_size: int = 10, authorization: str | None = Header(None)):
	email = _normalize_email(email)
	_validate_student_token(authorization, email)
	page = max(1, page)
	page_size = min(50, max(1, page_size))

	items = _student_assignment_results(email) + _student_test_results(email)
	items = sorted(items, key=lambda x: _to_iso_string(x.get("date")), reverse=True)

	start = (page - 1) * page_size
	end = start + page_size
	return {"items": items[start:end], "total": len(items)}


@router.get("/violations")
def student_violations(email: str, page: int = 1, page_size: int = 10, authorization: str | None = Header(None)):
	email = _normalize_email(email)
	_validate_student_token(authorization, email)
	page = max(1, page)
	page_size = min(50, max(1, page_size))

	items = _count_student_violations(email)[1]
	items = sorted(items, key=lambda x: _to_iso_string(x.get("date")), reverse=True)
	start = (page - 1) * page_size
	end = start + page_size

	return {"items": items[start:end], "total": len(items)}


@router.post("/join-test")
def student_join_test(payload: JoinTestPayload, authorization: str | None = Header(None)):
	email = _normalize_email(payload.email)
	_validate_student_token(authorization, email)
	test_id = payload.test_id.strip().upper()

	test_doc = live_tests_collection.find_one({"test_id": test_id}, {"_id": 0})
	if not test_doc:
		test_doc = live_tests_collection.find_one({"test_id": payload.test_id}, {"_id": 0})

	if not test_doc:
		raise HTTPException(404, "Test not found")

	expires_at = test_doc.get("expires_at")
	if expires_at:
		exp = expires_at
		if isinstance(expires_at, str):
			try:
				exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
			except ValueError:
				exp = None
		if isinstance(exp, datetime) and exp <= datetime.now(timezone.utc):
			raise HTTPException(400, "Test has expired")

	if test_submissions_collection.find_one({"student_email": email, "test_id": test_doc.get("test_id")}):
		raise HTTPException(400, "Duplicate submission is not allowed")

	questions = test_doc.get("questions") or []
	if not questions:
		questions = [
			{
				"question_id": 1,
				"question": "What is AWS?",
				"options": ["A cloud provider", "A text editor", "A hardware router", "A compiler"],
			}
		]

	sanitized_questions = []
	for idx, q in enumerate(questions, start=1):
		sanitized_questions.append(
			{
				"question_id": int(q.get("question_id") or idx),
				"question": q.get("question", ""),
				"options": q.get("options", []),
			}
		)

	return {
		"test_id": test_doc.get("test_id"),
		"subject": test_doc.get("subject", "General"),
		"duration": int(test_doc.get("duration") or 45),
		"questions": sanitized_questions,
	}


@router.post("/submit-test")
def student_submit_test(payload: SubmitTestPayload, authorization: str | None = Header(None)):
	email = _normalize_email(payload.email)
	_validate_student_token(authorization, email)
	test_id = payload.test_id.strip().upper()

	if test_submissions_collection.find_one({"student_email": email, "test_id": test_id}):
		raise HTTPException(400, "Duplicate submission is not allowed")

	test_doc = live_tests_collection.find_one({"test_id": test_id}, {"_id": 0})
	if not test_doc:
		raise HTTPException(404, "Test not found")

	answer_map = {}
	answers_raw = test_doc.get("answers") or []
	if answers_raw:
		for idx, answer in enumerate(answers_raw, start=1):
			if isinstance(answer, dict):
				qid = int(answer.get("question_id") or idx)
				answer_map[qid] = str(answer.get("correct") or "")
			else:
				answer_map[idx] = str(answer)

	if not answer_map:
		for idx, question in enumerate(test_doc.get("questions", []), start=1):
			correct = question.get("correct")
			if correct:
				answer_map[int(question.get("question_id") or idx)] = str(correct)

	student_answers = {item.question_id: item.selected for item in payload.answers}

	score = 0
	for qid, correct in answer_map.items():
		if student_answers.get(qid) == correct:
			score += 1

	total_questions = max(len(answer_map), 1)
	percentage = (score / total_questions) * 100

	test_submissions_collection.insert_one(
		{
			"student_email": email,
			"test_id": test_id,
			"answers": [a.dict() for a in payload.answers],
			"score": score,
			"percentage": round(percentage, 2),
			"violations": max(0, payload.violations),
			"total_questions": total_questions,
			"submitted_at": datetime.utcnow().isoformat() + "Z",
		}
	)

	return {
		"score": score,
		"percentage": round(percentage, 2),
		"pass": percentage >= 40,
	}


@router.get("/profile")
def student_profile(email: str, authorization: str | None = Header(None)):
	email = _normalize_email(email)
	_validate_student_token(authorization, email)
	return _student_profile_data(email)


def _student_profile_data(email: str):
	user = users_collection.find_one({"email": email, "role": "student"}, {"_id": 0})
	if not user:
		raise HTTPException(404, "Student not found")

	roll_number = (
		user.get("roll_number")
		or user.get("rollNumber")
		or user.get("roll_no")
		or user.get("roll")
		or user.get("student_roll")
		or ""
	)
	branch = (
		user.get("branch")
		or user.get("dept")
		or user.get("department")
		or user.get("course")
		or ""
	)
	section = (
		user.get("section")
		or user.get("class_section")
		or user.get("sec")
		or ""
	)

	return {
		"name": user.get("name", ""),
		"rollNumber": roll_number,
		"branch": branch,
		"section": section,
		"semester": user.get("semester", ""),
		"email": user.get("email", ""),
		"phone": user.get("phone", ""),
		"photo": user.get("photo", ""),
	}


@router.patch("/profile")
def update_student_profile(payload: UpdateProfilePayload, authorization: str | None = Header(None)):
	email = _normalize_email(payload.email)
	_validate_student_token(authorization, email)

	updates = {}
	if payload.phone is not None:
		updates["phone"] = payload.phone.strip()
	if payload.photo is not None:
		updates["photo"] = payload.photo.strip()
	if payload.password:
		updates["password"] = hash_password(payload.password)

	if updates:
		users_collection.update_one({"email": email, "role": "student"}, {"$set": updates})

	return _student_profile_data(email)


@router.get("/settings")
def student_settings(email: str, authorization: str | None = Header(None)):
	email = _normalize_email(email)
	_validate_student_token(authorization, email)
	settings = _student_settings_data(email)

	return {
		"darkMode": bool(settings.get("darkMode", True)),
		"notifications": bool(settings.get("notifications", True)),
		"language": settings.get("language", "English"),
	}


def _student_settings_data(email: str):
	user = users_collection.find_one({"email": email, "role": "student"}, {"_id": 0, "settings": 1}) or {}
	return user.get("settings") or {}


@router.patch("/settings")
def update_student_settings(payload: UpdateSettingsPayload, authorization: str | None = Header(None)):
	email = _normalize_email(payload.email)
	_validate_student_token(authorization, email)
	existing = _student_settings_data(email)

	settings = {
		"darkMode": bool(existing.get("darkMode", True)) if payload.darkMode is None else payload.darkMode,
		"notifications": bool(existing.get("notifications", True)) if payload.notifications is None else payload.notifications,
		"language": existing.get("language", "English") if payload.language is None else payload.language,
	}

	users_collection.update_one(
		{"email": email, "role": "student"},
		{"$set": {"settings": settings}},
		upsert=False,
	)

	return settings

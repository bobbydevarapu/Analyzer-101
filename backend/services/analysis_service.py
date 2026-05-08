from datetime import datetime

from ..database import (
    submissions_collection,
    results_collection,
    users_collection
)

from ..core.similarity import compare, get_embeddings
from ..core.decision import classify


def run_analysis(
    assignment_id: str,
    created_by: str | None = None
):

    dept_from_id = assignment_id.split("-")[0].upper()

    students = list(submissions_collection.find(
        {
            "assignment_id": assignment_id,
            "dept": dept_from_id
        },
        {"_id": 0}
    ))

    # Fetch emails from users collection
    for student in students:
        if "email" not in student or not student.get("email"):
            user = users_collection.find_one(
                {"roll": student.get("roll")},
                {"email": 1}
            )
            student["email"] = user.get("email") if user else None

    if len(students) < 2:
        return {
            "error": "Need at least 2 submissions",
            "total_students": len(students),
            "students": [],
            "matrix": [],
            "results": []
        }

    results = []
    matrix = []

    texts = [s["text"] for s in students]

    embeddings = get_embeddings(texts)

    for i in range(len(students)):

        row = []

        for j in range(len(students)):

            if i == j:
                row.append(100.0)

            else:
                res = compare(
                    students[i]["text"],
                    students[j]["text"],
                    embeddings[i],
                    embeddings[j]
                )

                row.append(res["final_score"])

        matrix.append(row)

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

    update_data = {
        "matrix": matrix,
        "results": results,
        "students": student_rolls,
        "total_students": len(students),
        "assignment_id": assignment_id
    }

    if created_by:
        update_data["created_by"] = created_by
        update_data["created_at"] = datetime.utcnow().isoformat() + "Z"
        update_data["created_at_dt"] = datetime.utcnow()

    results_collection.update_one(
        {"assignment_id": assignment_id},
        {"$set": update_data},
        upsert=True
    )

    return {
        "total_students": len(students),
        "students": student_rolls,
        "matrix": matrix,
        "results": results
    }
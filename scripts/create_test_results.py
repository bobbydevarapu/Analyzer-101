"""Create a test results document for an assignment to force email sends.

Usage:
  python scripts\create_test_results.py CSE-01

This will read submissions for the assignment and create a `results` document
with a high score and status 'Suspected' for each pair so the `/send` endpoint
actually has recipients to notify.
"""
import sys
import json
from pymongo import MongoClient

assignment_id = sys.argv[1] if len(sys.argv) > 1 else "CSE-01"
score = float(sys.argv[2]) if len(sys.argv) > 2 else 85.0
status = sys.argv[3] if len(sys.argv) > 3 else "Suspected"

client = MongoClient("mongodb://localhost:27017")
db = client["assignment_analyzer"]
submissions = db["submissions"]
results_collection = db["results"]

subs = list(submissions.find({"assignment_id": assignment_id}, {"_id": 0}))
if len(subs) < 2:
    print(f"Need at least 2 submissions for assignment {assignment_id} to create test results.")
    sys.exit(1)

results = []
# Create pairwise results with the provided score/status
for i in range(len(subs)):
    for j in range(i + 1, len(subs)):
        r = {
            "student1": subs[i].get("roll"),
            "student2": subs[j].get("roll"),
            "score": score,
            "status": status,
            "email1": subs[i].get("email"),
            "email2": subs[j].get("email"),
        }
        results.append(r)

# Create a simple matrix (100 on diag, score off diag)
matrix = []
for i in range(len(subs)):
    row = []
    for j in range(len(subs)):
        if i == j:
            row.append(100)
        else:
            row.append(score)
    matrix.append(row)

students = [s.get("roll") for s in subs]

doc = {
    "assignment_id": assignment_id,
    "matrix": matrix,
    "results": results,
    "students": students,
}

results_collection.update_one({"assignment_id": assignment_id}, {"$set": doc}, upsert=True)
print(f"Wrote test results for assignment={assignment_id}: pairs={len(results)}, unique_students={len(students)}")
print(json.dumps(doc, indent=2))

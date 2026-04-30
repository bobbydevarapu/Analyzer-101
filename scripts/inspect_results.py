"""Diagnostic helper: print results document for an assignment.

Usage:
  python scripts\inspect_results.py CSE-01
"""
import sys
import json
from pymongo import MongoClient

assignment_id = sys.argv[1] if len(sys.argv) > 1 else "CSE-01"
client = MongoClient("mongodb://localhost:27017")
db = client["assignment_analyzer"]
results_collection = db["results"]

doc = results_collection.find_one({"assignment_id": assignment_id}, {"_id": 0})
if not doc:
    print(f"No results document found for assignment_id={assignment_id}")
    sys.exit(0)

print(json.dumps(doc, indent=2))
results = doc.get("results", []) or []
print(f"\nTotal result pairs: {len(results)}")

emails = set()
for r in results:
    e1 = r.get("email1")
    e2 = r.get("email2")
    if e1:
        emails.add(e1)
    if e2:
        emails.add(e2)

print(f"Unique emails to notify: {len(emails)}")
for e in sorted(emails):
    print(" -", e)

students = doc.get("students", [])
print(f"\nStudents list length: {len(students)}")
if students:
    print("Sample students:")
    for s in students[:10]:
        print(" -", s)

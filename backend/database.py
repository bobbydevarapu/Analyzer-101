import os
from pymongo import MongoClient

mongo_url = os.getenv("MONGODB_URL", os.getenv("MONGO_URI", "mongodb://localhost:27017"))


def _build_client(uri: str) -> MongoClient:
	return MongoClient(
		uri,
		serverSelectionTimeoutMS=4000,
		connectTimeoutMS=4000,
		socketTimeoutMS=4000,
	)


def _probe_client(uri: str) -> MongoClient:
	client_instance = _build_client(uri)
	client_instance.admin.command("ping")
	return client_instance


try:
	client = _probe_client(mongo_url)
except Exception:
	fallback_url = os.getenv("MONGO_FALLBACK_URI", "mongodb://localhost:27017")
	try:
		client = _probe_client(fallback_url)
		mongo_url = fallback_url
		print("⚠️ MongoDB Atlas unavailable, using local MongoDB fallback")
	except Exception:
		client = _build_client(mongo_url)

db = client["assignment_analyzer"]

# CORE
submissions_collection = db["submissions"]
results_collection = db["results"]
tests_collection = db["tests"]

# AUTH
users_collection = db["users"]
teacher_requests_collection = db["teacher_requests"]

# FEATURES
violations_collection = db["violations"]
secret_keys_collection = db["secret_keys"]
live_tests_collection = db["live_tests"]
test_submissions_collection = db["test_submissions"]

# =========================
# INDEXES (IMPORTANT)
# =========================
submissions_collection.create_index([("assignment_id", 1), ("roll", 1)], unique=True)
results_collection.create_index("assignment_id", unique=True)
tests_collection.create_index("test_id", unique=True)
live_tests_collection.create_index("test_id", unique=True)
test_submissions_collection.create_index([("student_email", 1), ("test_id", 1)], unique=True)
violations_collection.create_index("email", unique=True)

# TTL indexes
results_collection.create_index("created_at_dt", expireAfterSeconds=604800)  # 7 days
secret_keys_collection.create_index("expires_at", expireAfterSeconds=0)
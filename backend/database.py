import os

from pymongo import MongoClient

mongo_url = os.getenv("MONGODB_URL", os.getenv("MONGO_URI", "mongodb://localhost:27017"))

client = MongoClient(mongo_url)
db = client["assignment_analyzer"]

submissions_collection = db["submissions"]   # 🔥 ADD THIS
results_collection = db["results"]
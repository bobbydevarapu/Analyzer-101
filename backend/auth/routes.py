from fastapi import APIRouter, Form, HTTPException
from datetime import datetime
from pymongo.errors import PyMongoError

from ..database import (
    users_collection,
    teacher_requests_collection,
)

from .auth_utils import (
    create_jwt,
    hash_password,
    verify_password,
)

router = APIRouter(tags=["Auth"])


# ========================
# SIGNUP
# ========================

@router.post("/signup")
def signup(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    role: str = Form("student")
):

    # ========================
    # CLEAN INPUTS
    # ========================

    name = name.strip()
    email = email.strip().lower()
    password = password.strip()
    role = (role or "student").strip().lower()

    # ========================
    # VALIDATE ROLE
    # ========================

    if role not in {"student", "teacher"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    # ========================
    # CHECK EXISTING USER
    # ========================

    try:

        existing_user = users_collection.find_one({
            "email": email
        })

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email already exists"
            )

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable"
        )

    # ========================
    # APPROVAL LOGIC
    # ========================

    approved = role == "student"

    # ========================
    # USER DOCUMENT
    # ========================

    user_document = {
        "name": name,

        # username generated from email
        "username": email.split("@")[0].lower(),

        "email": email,

        # HASHED PASSWORD
        "password": hash_password(password),

        "role": role,

        "approved": approved,

        "created_at": datetime.utcnow().isoformat() + "Z",
    }

    # ========================
    # INSERT USER
    # ========================

    try:

        users_collection.insert_one(
            user_document
        )

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable"
        )

    # ========================
    # TEACHER REQUEST
    # ========================

    if role == "teacher":

        try:

            teacher_requests_collection.insert_one({
                "name": name,
                "email": email,
                "role": role,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat() + "Z",
            })

        except PyMongoError:
            raise HTTPException(
                status_code=503,
                detail="Database temporarily unavailable"
            )

    return {
        "message": "Signup successful",
        "role": role,
    }


# ========================
# LOGIN
# ========================

@router.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...)
):

    # ========================
    # CLEAN INPUTS
    # ========================

    username = username.strip().lower()
    password = password.strip()

    # ========================
    # FIND USER
    # ========================

    try:

        user = users_collection.find_one({
            "$or": [
                {"email": username},
                {"username": username},
            ]
        })

    except PyMongoError:
        raise HTTPException(
            status_code=503,
            detail="Database temporarily unavailable"
        )

    # ========================
    # USER NOT FOUND
    # ========================

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    # ========================
    # PASSWORD CHECK
    # ========================

    stored_password = user.get("password")

    if not stored_password:
        raise HTTPException(
            status_code=401,
            detail="Password not found"
        )

    if not verify_password(
        password,
        stored_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    # ========================
    # TEACHER APPROVAL CHECK
    # ========================

    if (
        user.get("role") == "teacher"
        and not user.get("approved", False)
    ):
        raise HTTPException(
            status_code=403,
            detail="Your account is pending admin approval"
        )

    # ========================
    # DISPLAY NAME
    # ========================

    display_name = (
        user.get("name")
        or user.get("username")
        or user.get("email", "").split("@")[0]
    )

    # ========================
    # JWT TOKEN
    # ========================

    token = create_jwt({
        "sub": user.get("email"),
        "role": user.get("role"),
    })

    # ========================
    # RESPONSE
    # ========================

    return {
        "message": "Login successful",

        "role": user.get("role"),

        "email": user.get("email"),

        "display_name": display_name,

        "token": token,
    }
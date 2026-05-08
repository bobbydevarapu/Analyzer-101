import hashlib
import secrets
import base64
import hmac
import json
import os
import time

# 🔐 HASH PASSWORD
def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

# 🔍 VERIFY PASSWORD
def verify_password(password: str, hashed: str):
    return hash_password(password) == hashed

# 🔑 GENERATE PASSWORD
def generate_password():
    return secrets.token_urlsafe(8)

# 👤 GENERATE USERNAME
def generate_username(name: str):
    return name.lower().replace(" ", "_")


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("utf-8")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * ((4 - len(raw) % 4) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def create_jwt(payload: dict, expires_in_seconds: int = 86400) -> str:
    secret = os.environ.get("JWT_SECRET", "dev-secret-change-me")
    header = {"alg": "HS256", "typ": "JWT"}

    data = {
        **payload,
        "exp": int(time.time()) + expires_in_seconds,
    }

    header_part = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_part = _b64url_encode(json.dumps(data, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_part}.{payload_part}".encode("utf-8")
    signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_part = _b64url_encode(signature)

    return f"{header_part}.{payload_part}.{signature_part}"


def verify_jwt(token: str) -> dict:
    secret = os.environ.get("JWT_SECRET", "dev-secret-change-me")

    try:
        header_part, payload_part, signature_part = token.split(".")
    except ValueError as exc:
        raise ValueError("Invalid token format") from exc

    signing_input = f"{header_part}.{payload_part}".encode("utf-8")
    expected_signature = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    provided_signature = _b64url_decode(signature_part)

    if not hmac.compare_digest(expected_signature, provided_signature):
        raise ValueError("Invalid token signature")

    payload_raw = _b64url_decode(payload_part)
    payload = json.loads(payload_raw.decode("utf-8"))

    exp = int(payload.get("exp", 0) or 0)
    if exp <= int(time.time()):
        raise ValueError("Token expired")

    return payload
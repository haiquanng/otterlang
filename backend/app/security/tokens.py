import hashlib
import secrets
from datetime import datetime, timedelta
from uuid import UUID

import jwt

ALGORITHM = "HS256"


def create_access_token(user_id: UUID, secret: str, minutes: int, now: datetime) -> str:
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
    }
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def decode_access_token(token: str, secret: str) -> UUID:
    """Return the user id, or raise jwt.InvalidTokenError."""
    payload = jwt.decode(token, secret, algorithms=[ALGORITHM], options={"require": ["exp", "sub"]})
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("not an access token")
    try:
        return UUID(str(payload["sub"]))
    except ValueError as exc:
        raise jwt.InvalidTokenError("bad subject") from exc


def new_refresh_token() -> tuple[str, str]:
    """Return (raw token for the client, hash for the database)."""
    raw = secrets.token_urlsafe(32)
    return raw, hash_refresh_token(raw)


def hash_refresh_token(raw: str) -> str:
    # A fast hash is enough: the token is 256 random bits, not a guessable password.
    return hashlib.sha256(raw.encode()).hexdigest()

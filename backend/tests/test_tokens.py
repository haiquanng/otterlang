from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
import pytest

from app.security.tokens import (
    create_access_token,
    decode_access_token,
    hash_refresh_token,
    new_refresh_token,
)

SECRET = "s" * 40


def test_access_token_round_trip() -> None:
    user_id = uuid4()
    token = create_access_token(user_id, SECRET, 15, datetime.now(UTC))
    assert decode_access_token(token, SECRET) == user_id


def test_expired_access_token_is_rejected() -> None:
    issued = datetime.now(UTC) - timedelta(hours=1)
    token = create_access_token(uuid4(), SECRET, 15, issued)
    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token, SECRET)


def test_token_signed_with_another_secret_is_rejected() -> None:
    token = create_access_token(uuid4(), "x" * 40, 15, datetime.now(UTC))
    with pytest.raises(jwt.InvalidSignatureError):
        decode_access_token(token, SECRET)


def test_non_access_token_is_rejected() -> None:
    now = datetime.now(UTC)
    token = jwt.encode(
        {"sub": str(uuid4()), "type": "other", "exp": now + timedelta(minutes=5)},
        SECRET,
        algorithm="HS256",
    )
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token, SECRET)


def test_refresh_token_hash_matches_and_tokens_are_unique() -> None:
    raw, hashed = new_refresh_token()
    assert hash_refresh_token(raw) == hashed
    assert new_refresh_token()[0] != raw

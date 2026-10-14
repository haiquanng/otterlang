from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from psycopg import Connection
from psycopg.rows import DictRow

from app.config import Settings
from app.models import User
from app.repositories import refresh_tokens, users
from app.security.passwords import hash_password, needs_rehash, verify_password
from app.security.tokens import create_access_token, hash_refresh_token, new_refresh_token


class AuthError(Exception):
    """Base for failures the router maps to HTTP errors."""


class SignupDisabledError(AuthError):
    pass


class EmailTakenError(AuthError):
    pass


class InvalidCredentialsError(AuthError):
    pass


class InvalidRefreshTokenError(AuthError):
    pass


@dataclass(frozen=True)
class Session:
    user: User
    access_token: str
    refresh_token: str
    refresh_expires_at: datetime


def normalize_email(email: str) -> str:
    return email.strip().lower()


def signup(
    conn: Connection[DictRow],
    settings: Settings,
    email: str,
    password: str,
    display_name: str | None,
) -> Session:
    if not settings.signup_enabled:
        raise SignupDisabledError
    user = users.create(conn, normalize_email(email), hash_password(password), display_name)
    if user is None:
        raise EmailTakenError
    return _issue_session(conn, settings, user)


def login(conn: Connection[DictRow], settings: Settings, email: str, password: str) -> Session:
    user = users.get_by_email(conn, normalize_email(email))
    if not verify_password(user.password_hash if user else None, password) or user is None:
        raise InvalidCredentialsError
    if needs_rehash(user.password_hash):
        users.update_password_hash(conn, user.id, hash_password(password))
    return _issue_session(conn, settings, user)


def refresh(conn: Connection[DictRow], settings: Settings, raw_token: str) -> Session:
    token = refresh_tokens.find_for_update(conn, hash_refresh_token(raw_token))
    now = datetime.now(UTC)
    if token is None or token.expires_at <= now:
        raise InvalidRefreshTokenError
    if token.revoked_at is not None:
        # A rotated token came back: it was likely stolen. End every session of this user.
        refresh_tokens.revoke_all_for_user(conn, token.user_id)
        conn.commit()
        raise InvalidRefreshTokenError
    user = users.get_by_id(conn, token.user_id)
    if user is None:
        raise InvalidRefreshTokenError
    refresh_tokens.revoke(conn, token.id)
    return _issue_session(conn, settings, user)


def logout(conn: Connection[DictRow], raw_token: str) -> None:
    token = refresh_tokens.find_for_update(conn, hash_refresh_token(raw_token))
    if token is not None:
        refresh_tokens.revoke(conn, token.id)


def _issue_session(conn: Connection[DictRow], settings: Settings, user: User) -> Session:
    now = datetime.now(UTC)
    raw, token_hash = new_refresh_token()
    expires_at = now + timedelta(days=settings.refresh_token_days)
    refresh_tokens.insert(conn, user.id, token_hash, expires_at)
    access = create_access_token(user.id, settings.jwt_secret, settings.access_token_minutes, now)
    return Session(user=user, access_token=access, refresh_token=raw, refresh_expires_at=expires_at)

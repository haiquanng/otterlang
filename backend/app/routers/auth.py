from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Request, Response, status

from app.config import Settings, SettingsDep
from app.db import Conn
from app.rate_limit import RateLimiter
from app.schemas import LoginIn, SignupIn, TokenOut, UserOut
from app.services import auth

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "otter_refresh"

login_limiter_ip = RateLimiter(limit=20, window_seconds=600)
login_limiter_email = RateLimiter(limit=10, window_seconds=600)
signup_limiter_ip = RateLimiter(limit=5, window_seconds=3600)

_TOO_MANY = HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many attempts, try again later")
_BAD_REFRESH = HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired, sign in again")


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _respond(response: Response, settings: Settings, session: auth.Session) -> TokenOut:
    # Path-scoped so the refresh token is only ever sent to /auth endpoints.
    response.set_cookie(
        REFRESH_COOKIE,
        session.refresh_token,
        expires=session.refresh_expires_at,
        path=settings.cookie_path,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    return TokenOut(access_token=session.access_token, user=UserOut.from_user(session.user))


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    body: SignupIn, request: Request, response: Response, conn: Conn, settings: SettingsDep
) -> TokenOut:
    if not signup_limiter_ip.allow(_client_ip(request)):
        raise _TOO_MANY
    try:
        session = auth.signup(conn, settings, body.email, body.password, body.display_name)
    except auth.SignupDisabledError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sign-up is closed") from None
    except auth.EmailTakenError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered") from None
    return _respond(response, settings, session)


@router.post("/login")
def login(
    body: LoginIn, request: Request, response: Response, conn: Conn, settings: SettingsDep
) -> TokenOut:
    email_key = auth.normalize_email(body.email)
    if not login_limiter_ip.allow(_client_ip(request)) or not login_limiter_email.allow(email_key):
        raise _TOO_MANY
    try:
        session = auth.login(conn, settings, body.email, body.password)
    except auth.InvalidCredentialsError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Wrong email or password") from None
    return _respond(response, settings, session)


@router.post("/refresh")
def refresh(
    response: Response,
    conn: Conn,
    settings: SettingsDep,
    otter_refresh: Annotated[str | None, Cookie()] = None,
) -> TokenOut:
    if not otter_refresh:
        raise _BAD_REFRESH
    try:
        session = auth.refresh(conn, settings, otter_refresh)
    except auth.InvalidRefreshTokenError:
        raise _BAD_REFRESH from None
    return _respond(response, settings, session)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    conn: Conn,
    settings: SettingsDep,
    otter_refresh: Annotated[str | None, Cookie()] = None,
) -> None:
    if otter_refresh:
        auth.logout(conn, otter_refresh)
    response.delete_cookie(
        REFRESH_COOKIE,
        path=settings.cookie_path,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )

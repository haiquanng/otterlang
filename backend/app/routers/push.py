import hmac
import logging
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.config import Settings, SettingsDep
from app.db import Conn
from app.deps import CurrentUser
from app.rate_limit import RateLimiter
from app.repositories import push, review, users
from app.services.push_sender import Send, get_sender
from app.services.reminders import reminder_day, reminder_message, test_message

log = logging.getLogger(__name__)
test_limiter = RateLimiter(limit=5, window_seconds=600)
router = APIRouter(prefix="/push", tags=["push"])


class PublicKeyOut(BaseModel):
    key: str


class SubscriptionKeys(BaseModel):
    p256dh: str = Field(min_length=1, max_length=200)
    auth: str = Field(min_length=1, max_length=100)


class SubscriptionIn(BaseModel):
    endpoint: str = Field(min_length=10, max_length=1000, pattern=r"^https://")
    keys: SubscriptionKeys


class EndpointIn(BaseModel):
    endpoint: str = Field(min_length=10, max_length=1000)


class SendOut(BaseModel):
    sent: int = 0
    expired: int = 0
    failed: int = 0


class RunOut(SendOut):
    reminded: int = 0


def _send_to_devices(conn: Conn, user_id: UUID, message: dict[str, str], send: Send) -> SendOut:
    out = SendOut()
    for sub in push.for_user(conn, user_id):
        info: dict[str, object] = {
            "endpoint": sub["endpoint"],
            "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
        }
        result = send(info, message)
        if result == "sent":
            out.sent += 1
        elif result == "expired":
            push.remove_endpoint(conn, sub["endpoint"])
            out.expired += 1
        else:
            out.failed += 1
    return out


def _require_push(settings: Settings) -> None:
    if not settings.vapid_public_key or not settings.vapid_private_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminders are not set up on this server")


@router.get("/public-key")
def public_key(settings: SettingsDep) -> PublicKeyOut:
    if not settings.vapid_public_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminders are not set up on this server")
    return PublicKeyOut(key=settings.vapid_public_key)


@router.put("/subscription", status_code=status.HTTP_204_NO_CONTENT)
def subscribe(body: SubscriptionIn, user: CurrentUser, conn: Conn) -> None:
    push.upsert(conn, user.id, body.endpoint, body.keys.p256dh, body.keys.auth)


@router.post("/subscription/remove", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(body: EndpointIn, user: CurrentUser, conn: Conn) -> None:
    push.remove(conn, user.id, body.endpoint)


@router.post("/test")
def send_test(
    user: CurrentUser, conn: Conn, settings: SettingsDep, send: Annotated[Send, Depends(get_sender)]
) -> SendOut:
    """Sends one notification to the learner's devices now, to check reminders work."""
    _require_push(settings)
    if not test_limiter.allow(str(user.id)):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many test notifications")
    return _send_to_devices(conn, user.id, test_message(), send)


@router.post("/run")
def run_reminders(
    conn: Conn,
    settings: SettingsDep,
    send: Annotated[Send, Depends(get_sender)],
    x_reminder_secret: Annotated[str | None, Header()] = None,
) -> RunOut:
    """Called hourly by cron-job.org; sends the day's reminder to whoever is owed one."""
    secret = settings.reminder_secret
    _require_push(settings)
    if not secret:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminders are not set up on this server")
    if not x_reminder_secret or not hmac.compare_digest(x_reminder_secret, secret):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Wrong reminder secret")

    now = datetime.now(UTC)
    total = RunOut()
    for learner in users.with_reminders(conn):
        day = reminder_day(now, learner.timezone, learner.reminder_hour, learner.last_reminded_on)
        if day is None:
            continue
        due = review.count_due(conn, learner.id, now)
        if due == 0:
            continue
        out = _send_to_devices(conn, learner.id, reminder_message(due), send)
        total.sent += out.sent
        total.expired += out.expired
        total.failed += out.failed
        # Only a delivered reminder counts; if every device failed, the next hourly run retries.
        if out.sent:
            users.mark_reminded(conn, learner.id, day)
            total.reminded += 1
        elif out.failed:
            log.warning("reminder for %s failed on %d device(s)", learner.id, out.failed)
    return total

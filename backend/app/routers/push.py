import hmac
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from app.config import SettingsDep
from app.db import Conn
from app.deps import CurrentUser
from app.repositories import push, review, users
from app.services.push_sender import Send, get_sender
from app.services.reminders import reminder_day, reminder_message

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


class RunOut(BaseModel):
    reminded: int
    sent: int
    expired: int


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


@router.post("/run")
def run_reminders(
    conn: Conn,
    settings: SettingsDep,
    send: Annotated[Send, Depends(get_sender)],
    x_reminder_secret: Annotated[str | None, Header()] = None,
) -> RunOut:
    """Called hourly by cron-job.org; sends the day's reminder to whoever is owed one."""
    secret = settings.reminder_secret
    if not secret or not settings.vapid_private_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reminders are not set up on this server")
    if not x_reminder_secret or not hmac.compare_digest(x_reminder_secret, secret):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Wrong reminder secret")

    now = datetime.now(UTC)
    reminded = sent = expired = 0
    for learner in users.with_reminders(conn):
        day = reminder_day(now, learner.timezone, learner.reminder_hour, learner.last_reminded_on)
        if day is None:
            continue
        due = review.count_due(conn, learner.id, now)
        if due == 0:
            continue
        message = reminder_message(due)
        for sub in push.for_user(conn, learner.id):
            info: dict[str, object] = {
                "endpoint": sub["endpoint"],
                "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
            }
            result = send(info, message)
            if result == "sent":
                sent += 1
            elif result == "expired":
                push.remove_endpoint(conn, sub["endpoint"])
                expired += 1
        users.mark_reminded(conn, learner.id, day)
        reminded += 1
    return RunOut(reminded=reminded, sent=sent, expired=expired)

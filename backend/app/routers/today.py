from datetime import UTC, datetime, time, timedelta
from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import sources, today
from app.routers.sources import SourceSummary

router = APIRouter(tags=["today"])


class TodayOut(BaseModel):
    due_now: int
    due_later_today: int
    new_this_week: int
    total_words: int
    recent_documents: list[SourceSummary]


def end_of_day(now: datetime, tz_name: str) -> datetime:
    """Midnight at the end of the learner's local day, as a UTC timestamp."""
    try:
        zone = ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown timezone") from None
    local = now.astimezone(zone)
    midnight = datetime.combine(local.date() + timedelta(days=1), time.min, tzinfo=zone)
    return midnight.astimezone(UTC)


@router.get("/today")
def get_today(
    user: CurrentUser,
    conn: Conn,
    tz: Annotated[str, Query(max_length=64)] = "UTC",
) -> TodayOut:
    now = datetime.now(UTC)
    row = today.counts(conn, user.id, now, end_of_day(now, tz), now - timedelta(days=7))
    recent = sources.list_for_user(conn, user.id, limit=3)
    return TodayOut(
        due_now=row["due_now"],
        due_later_today=row["due_later_today"],
        new_this_week=row["new_this_week"],
        total_words=row["total_words"],
        recent_documents=[SourceSummary.model_validate(r) for r in recent],
    )

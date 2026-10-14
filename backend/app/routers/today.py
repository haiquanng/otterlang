from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import sources, today
from app.routers.sources import SourceSummary
from app.services.progress import (
    WEEK_DAYS,
    UnknownTimezoneError,
    end_of_day,
    fill_days,
    start_of_day,
    zone,
)

router = APIRouter(tags=["today"])


class DayOut(BaseModel):
    day: date
    reviews: int


class TodayOut(BaseModel):
    due_now: int
    due_later_today: int
    new_this_week: int
    total_words: int
    mastered_words: int
    reviewed_today: int
    daily_goal: int
    week: list[DayOut]
    recent_documents: list[SourceSummary]


@router.get("/today")
def get_today(
    user: CurrentUser,
    conn: Conn,
    tz: Annotated[str, Query(max_length=64)] = "UTC",
) -> TodayOut:
    try:
        tzinfo = zone(tz)
    except UnknownTimezoneError:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown timezone") from None
    now = datetime.now(UTC)
    row = today.counts(conn, user.id, now, end_of_day(now, tzinfo), now - timedelta(days=7))
    by_day = today.reviews_by_day(
        conn, user.id, start_of_day(now, tzinfo, days_ago=WEEK_DAYS - 1), tz
    )
    week = fill_days(by_day, now.astimezone(tzinfo).date())
    recent = sources.list_for_user(conn, user.id, limit=3)
    return TodayOut(
        due_now=row["due_now"],
        due_later_today=row["due_later_today"],
        new_this_week=row["new_this_week"],
        total_words=row["total_words"],
        mastered_words=today.mastered_words(conn, user.id),
        reviewed_today=week[-1].reviews,
        daily_goal=user.daily_goal,
        week=[DayOut(day=d.day, reviews=d.reviews) for d in week],
        recent_documents=[SourceSummary.model_validate(r) for r in recent],
    )

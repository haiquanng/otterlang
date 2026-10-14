"""Day boundaries in the learner's timezone and the 7-day activity series. Pure functions."""

from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

WEEK_DAYS = 7


class UnknownTimezoneError(ValueError):
    pass


@dataclass(frozen=True)
class DayCount:
    day: date
    reviews: int


def zone(tz_name: str) -> ZoneInfo:
    try:
        return ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        raise UnknownTimezoneError(tz_name) from None


def start_of_day(now: datetime, tz: ZoneInfo, days_ago: int = 0) -> datetime:
    """Local midnight `days_ago` days before today, as a UTC timestamp."""
    local_day = now.astimezone(tz).date() - timedelta(days=days_ago)
    return datetime.combine(local_day, time.min, tzinfo=tz).astimezone(UTC)


def end_of_day(now: datetime, tz: ZoneInfo) -> datetime:
    """Midnight at the end of the learner's local day, as a UTC timestamp."""
    return start_of_day(now, tz, days_ago=-1)


def fill_days(counts: dict[date, int], today: date, days: int = WEEK_DAYS) -> list[DayCount]:
    """One entry per day ending today, oldest first, zero where there were no reviews."""
    first = today - timedelta(days=days - 1)
    return [
        DayCount(day=first + timedelta(days=i), reviews=counts.get(first + timedelta(days=i), 0))
        for i in range(days)
    ]

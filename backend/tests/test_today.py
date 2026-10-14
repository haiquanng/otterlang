from datetime import UTC, date, datetime

import pytest

from app.services.progress import (
    UnknownTimezoneError,
    end_of_day,
    fill_days,
    start_of_day,
    zone,
)

HCM = zone("Asia/Ho_Chi_Minh")


def test_end_of_day_uses_the_learners_timezone() -> None:
    # 20:00 UTC on Oct 14 is already 03:00 on Oct 15 in Ho Chi Minh City (UTC+7).
    now = datetime(2026, 10, 14, 20, 0, tzinfo=UTC)
    assert end_of_day(now, HCM) == datetime(2026, 10, 15, 17, 0, tzinfo=UTC)
    assert end_of_day(now, zone("UTC")) == datetime(2026, 10, 15, 0, 0, tzinfo=UTC)


def test_start_of_day_counts_back_whole_local_days() -> None:
    now = datetime(2026, 10, 14, 20, 0, tzinfo=UTC)  # Oct 15, 03:00 local
    assert start_of_day(now, HCM) == datetime(2026, 10, 14, 17, 0, tzinfo=UTC)
    assert start_of_day(now, HCM, days_ago=6) == datetime(2026, 10, 8, 17, 0, tzinfo=UTC)


def test_unknown_timezone_is_rejected() -> None:
    with pytest.raises(UnknownTimezoneError):
        zone("Mars/Olympus_Mons")


def test_fill_days_gives_seven_days_oldest_first_with_zeros() -> None:
    week = fill_days({date(2026, 10, 15): 12, date(2026, 10, 12): 3}, date(2026, 10, 15))
    assert [d.day.day for d in week] == [9, 10, 11, 12, 13, 14, 15]
    assert [d.reviews for d in week] == [0, 0, 0, 3, 0, 0, 12]

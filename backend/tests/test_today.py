from datetime import UTC, datetime

import pytest
from fastapi import HTTPException

from app.routers.today import end_of_day


def test_end_of_day_uses_the_learners_timezone() -> None:
    # 20:00 UTC on Oct 14 is already 03:00 on Oct 15 in Ho Chi Minh City (UTC+7).
    now = datetime(2026, 10, 14, 20, 0, tzinfo=UTC)
    assert end_of_day(now, "Asia/Ho_Chi_Minh") == datetime(2026, 10, 15, 17, 0, tzinfo=UTC)
    assert end_of_day(now, "UTC") == datetime(2026, 10, 15, 0, 0, tzinfo=UTC)


def test_unknown_timezone_is_rejected() -> None:
    with pytest.raises(HTTPException):
        end_of_day(datetime.now(UTC), "Mars/Olympus_Mons")

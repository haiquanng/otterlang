from datetime import UTC, date, datetime

from app.services.reminders import reminder_day, reminder_message

# 12:30 UTC is 19:30 in Ho Chi Minh City (UTC+7).
NOW = datetime(2026, 10, 15, 12, 30, tzinfo=UTC)
HCM = "Asia/Ho_Chi_Minh"


def test_owed_once_the_local_hour_has_passed() -> None:
    assert reminder_day(NOW, HCM, 19, None) == date(2026, 10, 15)
    assert reminder_day(NOW, HCM, 20, None) is None


def test_a_missed_run_still_sends_later_the_same_day() -> None:
    assert reminder_day(NOW, HCM, 8, date(2026, 10, 14)) == date(2026, 10, 15)


def test_never_twice_on_the_same_local_day() -> None:
    assert reminder_day(NOW, HCM, 8, date(2026, 10, 15)) is None


def test_local_date_can_differ_from_utc() -> None:
    late = datetime(2026, 10, 15, 18, 0, tzinfo=UTC)  # already Oct 16, 01:00 in HCM
    assert reminder_day(late, HCM, 0, date(2026, 10, 15)) == date(2026, 10, 16)


def test_message_counts_cards() -> None:
    assert reminder_message(1)["body"].startswith("1 card is waiting")
    assert reminder_message(8)["body"].startswith("8 cards are waiting")
    assert reminder_message(3)["url"] == "/review"

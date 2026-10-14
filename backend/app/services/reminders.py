"""Who gets a daily reminder, and what it says. Pure functions."""

from datetime import date, datetime

from app.services.progress import zone


def reminder_day(
    now: datetime, tz_name: str, reminder_hour: int, last_reminded_on: date | None
) -> date | None:
    """The learner's local date if a reminder is owed now, else None.

    "Owed" means the local reminder hour has passed today and nothing was sent today,
    so a missed hourly run still sends later that day, but never twice.
    """
    local = now.astimezone(zone(tz_name))
    if local.hour < reminder_hour or last_reminded_on == local.date():
        return None
    return local.date()


def reminder_message(due: int) -> dict[str, str]:
    cards = "card is" if due == 1 else "cards are"
    return {
        "title": "Time for a quick review",
        "body": f"{due} {cards} waiting. A few minutes keeps them fresh.",
        "url": "/review",
    }

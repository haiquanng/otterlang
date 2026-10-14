from dataclasses import dataclass
from datetime import date
from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow

from app.models import User


@dataclass(frozen=True)
class Profile:
    """The fields a learner can change about themselves."""

    display_name: str | None
    skip_top_n: int
    daily_goal: int
    reminder_enabled: bool
    reminder_hour: int
    timezone: str


def _to_user(row: DictRow) -> User:
    return User(**row)


def get_by_id(conn: Connection[DictRow], user_id: UUID) -> User | None:
    row = conn.execute(
        "select id, email, password_hash, display_name, skip_top_n, daily_goal, "
        "reminder_enabled, reminder_hour, timezone, last_reminded_on, is_admin, created_at "
        "from users where id = %s",
        (user_id,),
    ).fetchone()
    return _to_user(row) if row else None


def get_by_email(conn: Connection[DictRow], email: str) -> User | None:
    row = conn.execute(
        "select id, email, password_hash, display_name, skip_top_n, daily_goal, "
        "reminder_enabled, reminder_hour, timezone, last_reminded_on, is_admin, created_at "
        "from users where email = %s",
        (email,),
    ).fetchone()
    return _to_user(row) if row else None


def create(
    conn: Connection[DictRow], email: str, password_hash: str, display_name: str | None
) -> User | None:
    """Return the new user, or None when the email is taken."""
    row = conn.execute(
        "insert into users (email, password_hash, display_name) values (%s, %s, %s) "
        "on conflict (email) do nothing "
        "returning id, email, password_hash, display_name, skip_top_n, daily_goal, "
        "reminder_enabled, reminder_hour, timezone, last_reminded_on, is_admin, created_at",
        (email, password_hash, display_name),
    ).fetchone()
    return _to_user(row) if row else None


def update_profile(conn: Connection[DictRow], user_id: UUID, profile: Profile) -> User:
    row = conn.execute(
        "update users set display_name = %s, skip_top_n = %s, daily_goal = %s, "
        "reminder_enabled = %s, reminder_hour = %s, timezone = %s where id = %s "
        "returning id, email, password_hash, display_name, skip_top_n, daily_goal, "
        "reminder_enabled, reminder_hour, timezone, last_reminded_on, is_admin, created_at",
        (
            profile.display_name,
            profile.skip_top_n,
            profile.daily_goal,
            profile.reminder_enabled,
            profile.reminder_hour,
            profile.timezone,
            user_id,
        ),
    ).fetchone()
    if row is None:
        raise LookupError(f"user {user_id} not found")
    return _to_user(row)


def update_password_hash(conn: Connection[DictRow], user_id: UUID, password_hash: str) -> None:
    conn.execute("update users set password_hash = %s where id = %s", (password_hash, user_id))


def mark_reminded(conn: Connection[DictRow], user_id: UUID, local_day: date) -> None:
    conn.execute("update users set last_reminded_on = %s where id = %s", (local_day, user_id))


def with_reminders(conn: Connection[DictRow]) -> list[User]:
    """Learners who turned reminders on and have at least one subscribed device."""
    rows = conn.execute(
        "select id, email, password_hash, display_name, skip_top_n, daily_goal, "
        "reminder_enabled, reminder_hour, timezone, last_reminded_on, is_admin, created_at "
        "from users u where reminder_enabled "
        "and exists (select 1 from push_subscriptions p where p.user_id = u.id)"
    ).fetchall()
    return [_to_user(row) for row in rows]

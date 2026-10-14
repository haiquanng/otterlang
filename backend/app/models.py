from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass(frozen=True)
class User:
    id: UUID
    email: str
    password_hash: str
    display_name: str | None
    skip_top_n: int
    daily_goal: int
    reminder_enabled: bool
    reminder_hour: int
    timezone: str
    last_reminded_on: date | None
    is_admin: bool
    created_at: datetime


@dataclass(frozen=True)
class RefreshToken:
    id: UUID
    user_id: UUID
    expires_at: datetime
    revoked_at: datetime | None

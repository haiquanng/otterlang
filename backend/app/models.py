from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class User:
    id: UUID
    email: str
    password_hash: str
    display_name: str | None
    skip_top_n: int
    is_admin: bool
    created_at: datetime


@dataclass(frozen=True)
class RefreshToken:
    id: UUID
    user_id: UUID
    expires_at: datetime
    revoked_at: datetime | None

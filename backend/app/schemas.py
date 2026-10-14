from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models import User


class UserOut(BaseModel):
    id: UUID
    email: str
    display_name: str | None
    skip_top_n: int
    daily_goal: int

    @classmethod
    def from_user(cls, user: User) -> "UserOut":
        return cls(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            skip_top_n=user.skip_top_n,
            daily_goal=user.daily_goal,
        )


class SignupIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(default=None, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"  # noqa: S105 - OAuth token type, not a secret
    user: UserOut


class MeUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=80)
    skip_top_n: int | None = Field(default=None, ge=0, le=50_000)
    daily_goal: int | None = Field(default=None, ge=1, le=200)

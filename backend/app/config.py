from functools import lru_cache
from typing import Annotated, Literal

from fastapi import Depends
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    jwt_secret: str = Field(min_length=32)
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    signup_enabled: bool = False
    # Comma-separated so it reads the same in Render's env UI and in .env.
    cors_origins: str = "http://localhost:5173"
    # In production the browser reaches the API through Vercel's /api proxy, so the refresh
    # cookie is first-party (Safari blocks third-party cookies). The path must then match
    # what the browser sees: /api/auth. Locally the browser calls the API directly: /auth.
    cookie_secure: bool = True
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    cookie_path: str = "/auth"
    # Web Push reminders; all four must be set for reminders to work (see deployment.md).
    vapid_public_key: str | None = None
    vapid_private_key: str | None = None
    vapid_subject: str = "mailto:otterlang21@gmail.com"
    reminder_secret: str | None = None
    ai_enabled: bool = False
    gemini_api_key: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


SettingsDep = Annotated[Settings, Depends(get_settings)]

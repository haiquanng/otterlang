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
    # Production runs frontend (Vercel) and API (Render) on different sites,
    # which needs SameSite=None + Secure for the refresh cookie.
    cookie_secure: bool = True
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    ai_enabled: bool = False
    gemini_api_key: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


SettingsDep = Annotated[Settings, Depends(get_settings)]

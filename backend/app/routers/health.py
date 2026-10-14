from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthOut(BaseModel):
    status: Literal["ok"] = "ok"


# Hit by the keep-awake cron every few minutes, so it must stay cheap: no database call.
@router.api_route("/health", methods=["GET", "HEAD"])
def health() -> HealthOut:
    return HealthOut()

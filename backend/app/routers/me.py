from fastapi import APIRouter, HTTPException, status

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import users
from app.schemas import MeUpdate, UserOut
from app.services.progress import UnknownTimezoneError, zone

router = APIRouter(tags=["me"])


@router.get("/me")
def get_me(user: CurrentUser) -> UserOut:
    return UserOut.from_user(user)


@router.patch("/me")
def update_me(body: MeUpdate, user: CurrentUser, conn: Conn) -> UserOut:
    if body.timezone is not None:
        try:
            zone(body.timezone)
        except UnknownTimezoneError:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Unknown timezone") from None
    # Only fields present in the request change; an explicit null clears display_name.
    profile = users.Profile(
        display_name=body.display_name
        if "display_name" in body.model_fields_set
        else user.display_name,
        skip_top_n=user.skip_top_n if body.skip_top_n is None else body.skip_top_n,
        daily_goal=user.daily_goal if body.daily_goal is None else body.daily_goal,
        reminder_enabled=user.reminder_enabled
        if body.reminder_enabled is None
        else body.reminder_enabled,
        reminder_hour=user.reminder_hour if body.reminder_hour is None else body.reminder_hour,
        timezone=user.timezone if body.timezone is None else body.timezone,
    )
    return UserOut.from_user(users.update_profile(conn, user.id, profile))

from fastapi import APIRouter

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import users
from app.schemas import MeUpdate, UserOut

router = APIRouter(tags=["me"])


@router.get("/me")
def get_me(user: CurrentUser) -> UserOut:
    return UserOut.from_user(user)


@router.patch("/me")
def update_me(body: MeUpdate, user: CurrentUser, conn: Conn) -> UserOut:
    # Only fields present in the request change; an explicit null clears display_name.
    fields = body.model_fields_set
    display_name = body.display_name if "display_name" in fields else user.display_name
    skip_top_n = body.skip_top_n if body.skip_top_n is not None else user.skip_top_n
    daily_goal = body.daily_goal if body.daily_goal is not None else user.daily_goal
    return UserOut.from_user(
        users.update_profile(conn, user.id, display_name, skip_top_n, daily_goal)
    )

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import speaking

router = APIRouter(prefix="/speaking", tags=["speaking"])


class PracticeSentenceOut(BaseModel):
    id: UUID
    item_id: UUID
    term: str
    sentence: str
    # Written by the learner on a writing card, not taken from a document.
    mine: bool


@router.get("/sentences")
def sentences(
    user: CurrentUser, conn: Conn, limit: Annotated[int, Query(ge=1, le=30)] = 10
) -> list[PracticeSentenceOut]:
    rows = speaking.practice_sentences(conn, user.id, limit)
    return [PracticeSentenceOut.model_validate(dict(row)) for row in rows]

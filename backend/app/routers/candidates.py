from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import items, known_words, sources
from app.services.extraction import extract_candidates

router = APIRouter(prefix="/sources", tags=["candidates"])


class CandidateOut(BaseModel):
    lemma: str
    surface: str
    sentence: str
    rank: int | None
    count: int


@router.get("/{source_id}/candidates")
def list_candidates(source_id: UUID, user: CurrentUser, conn: Conn) -> list[CandidateOut]:
    source = sources.get(conn, user.id, source_id)
    if source is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    candidates = extract_candidates(
        source["body"],
        skip_top_n=user.skip_top_n,
        known=known_words.lemmas_for_user(conn, user.id),
        saved=items.lemmas_for_user(conn, user.id),
    )
    return [
        CandidateOut(
            lemma=c.lemma, surface=c.surface, sentence=c.sentence, rank=c.rank, count=c.count
        )
        for c in candidates
    ]

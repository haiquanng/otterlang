from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import items, known_words, sources
from app.services.dictionary import Fetch, get_dictionary_fetch
from app.services.extraction import lemmatize, word_rank
from app.services.reading import define, normalize_word, saved_surfaces

router = APIRouter(tags=["reading"])


class LookupOut(BaseModel):
    word: str
    lemma: str
    definition: str | None
    phonetic: str | None
    pos: str | None
    rank: int | None
    status: Literal["saved", "known", "new"]
    item_id: UUID | None


class AnnotationsOut(BaseModel):
    # Lowercase surface form -> id of the saved item it belongs to.
    saved: dict[str, UUID]


@router.get("/lookup")
def lookup(
    user: CurrentUser,
    conn: Conn,
    fetch: Annotated[Fetch, Depends(get_dictionary_fetch)],
    word: Annotated[str, Query(min_length=1, max_length=64)],
) -> LookupOut:
    surface = normalize_word(word)
    if surface is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Not a single English word")
    lemma = lemmatize(surface)
    item_id = items.find(conn, user.id, "word", lemma)
    known = lemma in known_words.lemmas_for_user(conn, user.id)
    meaning = define(conn, fetch, lemma)
    return LookupOut(
        word=surface,
        lemma=lemma,
        definition=meaning.definition,
        phonetic=meaning.phonetic,
        pos=meaning.pos,
        rank=word_rank(lemma),
        status="saved" if item_id else "known" if known else "new",
        item_id=item_id,
    )


@router.get("/sources/{source_id}/annotations")
def annotations(source_id: UUID, user: CurrentUser, conn: Conn) -> AnnotationsOut:
    source = sources.get(conn, user.id, source_id)
    if source is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    saved = saved_surfaces(source["body"], items.active_word_ids(conn, user.id))
    return AnnotationsOut(saved=saved)

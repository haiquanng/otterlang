import re
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status
from pydantic import AfterValidator, BaseModel, Field

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import known_words

router = APIRouter(prefix="/known-words", tags=["known-words"])

_LEMMA = re.compile(r"[a-z]+(?:['-][a-z]+)*")
MAX_LEMMA_LENGTH = 64


def _normalize_lemma(value: str) -> str:
    # Normalize first, then validate, so " Notoriously " is accepted as "notoriously".
    lemma = value.strip().lower()
    if len(lemma) > MAX_LEMMA_LENGTH or not _LEMMA.fullmatch(lemma):
        raise ValueError("must be a single English word")
    return lemma


Lemma = Annotated[str, AfterValidator(_normalize_lemma)]


class KnownWordIn(BaseModel):
    lemma: Lemma


class KnownWordsBulkIn(BaseModel):
    lemmas: list[Lemma] = Field(min_length=1, max_length=500)


class AddedOut(BaseModel):
    added: int


@router.post("", status_code=status.HTTP_201_CREATED)
def add_known_word(body: KnownWordIn, user: CurrentUser, conn: Conn) -> AddedOut:
    return AddedOut(added=known_words.add(conn, user.id, [body.lemma]))


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def add_known_words(body: KnownWordsBulkIn, user: CurrentUser, conn: Conn) -> AddedOut:
    return AddedOut(added=known_words.add(conn, user.id, sorted(set(body.lemmas))))


@router.delete("/{lemma}", status_code=status.HTTP_204_NO_CONTENT)
def remove_known_word(
    lemma: Annotated[str, Path(max_length=MAX_LEMMA_LENGTH)], user: CurrentUser, conn: Conn
) -> None:
    if not known_words.remove(conn, user.id, lemma.strip().lower()):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not in your known words")

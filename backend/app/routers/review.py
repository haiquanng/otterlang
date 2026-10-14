from datetime import UTC, datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from psycopg.rows import DictRow
from pydantic import BaseModel, Field

from app.db import Conn
from app.deps import CurrentUser
from app.repositories import items, review
from app.services.grading import cloze, grade
from app.services.scheduling import schedule
from app.services.sentence_check import check_sentence

router = APIRouter(prefix="/review", tags=["review"])

CardType = Literal["cloze", "define_to_word", "word_in_use", "write_sentence"]
_NOT_FOUND = HTTPException(status.HTTP_404_NOT_FOUND, "Card not found")


class ReviewCardOut(BaseModel):
    """What the learner sees before answering; the answer itself is not included."""

    id: UUID
    item_id: UUID
    card_type: CardType
    prompt: str
    hint: str | None
    is_new: bool


class CheckIn(BaseModel):
    # Long enough for a written sentence, not just a single word.
    answer: str = Field(max_length=500)
    response_ms: int | None = Field(default=None, ge=0, le=3_600_000)


class CheckOut(BaseModel):
    correct: bool
    close: bool
    expected: str
    sentence: str | None
    definition: str | None
    suggested_rating: int
    # Writing cards: codes such as missing_word, too_short (empty for other cards).
    issues: list[str] = Field(default_factory=list)


class AnswerIn(BaseModel):
    rating: int = Field(ge=1, le=4)
    correct: bool | None = None
    response_ms: int | None = Field(default=None, ge=0, le=3_600_000)
    # Writing cards: the learner's sentence, kept as an example when it uses the word.
    sentence: str | None = Field(default=None, max_length=500)


class AnswerOut(BaseModel):
    due: datetime
    state: str


def _to_card(row: DictRow) -> ReviewCardOut | None:
    """Build the prompt; None when the card cannot be shown (e.g. definition was removed)."""
    if row["card_type"] == "cloze" and row["sentence"]:
        prompt = cloze(row["sentence"], row["lemma"], row["surface"])
        hint = row["definition"]
    elif row["card_type"] == "define_to_word" and row["definition"]:
        prompt, hint = row["definition"], f"{row['term'][0]}…"
    elif row["card_type"] == "write_sentence":
        prompt, hint = row["term"], row["definition"]
    else:
        return None
    if prompt is None:
        return None
    return ReviewCardOut(
        id=row["id"],
        item_id=row["item_id"],
        card_type=row["card_type"],
        prompt=prompt,
        hint=hint,
        is_new=row["state"] == "new",
    )


@router.get("/due")
def due(
    user: CurrentUser, conn: Conn, limit: Annotated[int, Query(ge=1, le=100)] = 20
) -> list[ReviewCardOut]:
    rows = review.due_cards(conn, user.id, datetime.now(UTC), limit)
    return [card for card in map(_to_card, rows) if card is not None]


@router.post("/{card_id}/check")
def check(card_id: UUID, body: CheckIn, user: CurrentUser, conn: Conn) -> CheckOut:
    row = review.get_card(conn, user.id, card_id)
    if row is None:
        raise _NOT_FOUND
    if row["card_type"] == "write_sentence":
        feedback = check_sentence(body.answer, row["lemma"], row["surface"])
        return CheckOut(
            correct=feedback.ok,
            close=False,
            expected=row["term"],
            sentence=body.answer.strip(),
            definition=row["definition"],
            suggested_rating=feedback.suggested_rating,
            issues=feedback.issues,
        )
    result = grade(body.answer, row["lemma"], row["surface"], body.response_ms)
    return CheckOut(
        correct=result.correct,
        close=result.close,
        expected=row["term"] if row["card_type"] == "define_to_word" else result.expected,
        sentence=row["sentence"],
        definition=row["definition"],
        suggested_rating=result.suggested_rating,
    )


@router.post("/{card_id}/answer")
def answer(card_id: UUID, body: AnswerIn, user: CurrentUser, conn: Conn) -> AnswerOut:
    row = review.get_card(conn, user.id, card_id)
    if row is None:
        raise _NOT_FOUND
    updated = schedule(review.to_state(row), body.rating, datetime.now(UTC))
    review.save_review(conn, user.id, card_id, updated, body.rating, body.correct, body.response_ms)
    if row["card_type"] == "write_sentence" and body.sentence:
        sentence = body.sentence.strip()
        if check_sentence(sentence, row["lemma"], row["surface"]).uses_word:
            items.add_context(
                conn, user.id, row["item_id"], None, sentence, None, written_by_learner=True
            )
    return AnswerOut(due=updated.due, state=updated.state)

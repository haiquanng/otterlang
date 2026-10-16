import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field

from app.config import SettingsDep
from app.db import Conn
from app.deps import CurrentUser
from app.rate_limit import RateLimiter
from app.repositories import ai_feedback
from app.services.ai import AiUnavailableError, AskJson, get_ask_json
from app.services.writing_feedback import WritingFeedback, ask_feedback, sentence_hash

log = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["ai"])
user_limiter = RateLimiter(limit=10, window_seconds=60)
ip_limiter = RateLimiter(limit=30, window_seconds=60)


class FeedbackIn(BaseModel):
    card_id: UUID
    sentence: str = Field(min_length=1, max_length=500)


@router.post("/feedback")
def feedback(
    body: FeedbackIn,
    request: Request,
    user: CurrentUser,
    conn: Conn,
    settings: SettingsDep,
    ask: Annotated[AskJson | None, Depends(get_ask_json)],
) -> WritingFeedback:
    """Feedback on a sentence written on a writing card. Never needed to rate the card."""
    if ask is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "AI is off on this server")
    word = ai_feedback.writing_card_word(conn, user.id, body.card_id)
    if word is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Card not found")

    key = sentence_hash(body.sentence)
    hit = ai_feedback.cached(conn, user.id, word["lemma"], key)
    if hit is not None:
        return WritingFeedback.model_validate(hit)

    ip = request.client.host if request.client else "unknown"
    if not user_limiter.allow(str(user.id)) or not ip_limiter.allow(ip):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Too many requests")
    since = datetime.now(UTC) - timedelta(days=1)
    if ai_feedback.count_since(conn, user.id, since) >= settings.ai_daily_limit:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Daily AI limit reached")

    try:
        result = ask_feedback(ask, word["term"], word["definition"], body.sentence)
    except AiUnavailableError as exc:
        log.warning("AI feedback unavailable: %s", exc)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI feedback unavailable") from exc
    ai_feedback.save(conn, user.id, word["lemma"], key, result.model_dump())
    return result

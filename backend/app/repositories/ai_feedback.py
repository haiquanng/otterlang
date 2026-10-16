from datetime import datetime
from typing import Any
from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow
from psycopg.types.json import Jsonb


def writing_card_word(conn: Connection[DictRow], user_id: UUID, card_id: UUID) -> DictRow | None:
    # No row lock: the AI call can take seconds and must not block rating the card.
    return conn.execute(
        "select i.term, i.lemma, i.definition from cards c "
        "join items i on i.id = c.item_id and i.status = 'active' "
        "where c.user_id = %s and c.id = %s and c.card_type = 'write_sentence'",
        (user_id, card_id),
    ).fetchone()


def cached(
    conn: Connection[DictRow], user_id: UUID, lemma: str, sentence_hash: str
) -> dict[str, Any] | None:
    row = conn.execute(
        "select feedback from ai_feedback where user_id = %s and lemma = %s and sentence_hash = %s",
        (user_id, lemma, sentence_hash),
    ).fetchone()
    return dict(row["feedback"]) if row else None


def save(
    conn: Connection[DictRow],
    user_id: UUID,
    lemma: str,
    sentence_hash: str,
    feedback: dict[str, Any],
) -> None:
    conn.execute(
        "insert into ai_feedback (user_id, lemma, sentence_hash, feedback) "
        "values (%s, %s, %s, %s) on conflict (user_id, lemma, sentence_hash) do nothing",
        (user_id, lemma, sentence_hash, Jsonb(feedback)),
    )


def count_since(conn: Connection[DictRow], user_id: UUID, since: datetime) -> int:
    row = conn.execute(
        "select count(*) as n from ai_feedback where user_id = %s and created_at >= %s",
        (user_id, since),
    ).fetchone()
    return int(row["n"]) if row else 0

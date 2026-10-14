from datetime import datetime
from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow

from app.services.scheduling import CardState

# One row per card, with what is needed to show it: the item's lemma and definition and
# its first context sentence. Archived items never come up for review.
_CARD_SELECT = """
    select c.id, c.card_type, c.item_id, c.state, c.step, c.stability, c.difficulty, c.due,
      c.last_review, c.reps, c.lapses, i.term, i.lemma, i.definition,
      ctx.sentence, ctx.surface
    from cards c
    join items i on i.id = c.item_id and i.status = 'active'
    left join lateral (
      select sentence, surface from item_contexts x
      where x.item_id = i.id order by x.written_by_learner, x.created_at limit 1
    ) ctx on true
"""


def due_cards(conn: Connection[DictRow], user_id: UUID, now: datetime, limit: int) -> list[DictRow]:
    return conn.execute(
        _CARD_SELECT + " where c.user_id = %s and c.due <= %s order by c.due limit %s",
        (user_id, now, limit),
    ).fetchall()


def count_due(conn: Connection[DictRow], user_id: UUID, until: datetime) -> int:
    row = conn.execute(
        "select count(*) as n from cards c join items i on i.id = c.item_id "
        "where c.user_id = %s and i.status = 'active' and c.due <= %s",
        (user_id, until),
    ).fetchone()
    return int(row["n"]) if row else 0


def get_card(conn: Connection[DictRow], user_id: UUID, card_id: UUID) -> DictRow | None:
    return conn.execute(
        _CARD_SELECT + " where c.user_id = %s and c.id = %s for update of c",
        (user_id, card_id),
    ).fetchone()


def to_state(row: DictRow) -> CardState:
    return CardState(
        state=row["state"],
        step=row["step"],
        stability=row["stability"],
        difficulty=row["difficulty"],
        due=row["due"],
        last_review=row["last_review"],
        reps=row["reps"],
        lapses=row["lapses"],
    )


def save_review(
    conn: Connection[DictRow],
    user_id: UUID,
    card_id: UUID,
    new: CardState,
    rating: int,
    correct: bool | None,
    response_ms: int | None,
) -> None:
    conn.execute(
        "update cards set state = %s::card_state, step = %s, stability = %s, difficulty = %s, "
        "due = %s, last_review = %s, reps = %s, lapses = %s where user_id = %s and id = %s",
        (
            new.state,
            new.step,
            new.stability,
            new.difficulty,
            new.due,
            new.last_review,
            new.reps,
            new.lapses,
            user_id,
            card_id,
        ),
    )
    conn.execute(
        "insert into review_logs (user_id, card_id, rating, correct, response_ms) "
        "values (%s, %s, %s, %s, %s)",
        (user_id, card_id, rating, correct, response_ms),
    )

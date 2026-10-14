from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow


def ensure(conn: Connection[DictRow], user_id: UUID, item_id: UUID, card_types: list[str]) -> None:
    """Create the given card types for an item; existing ones keep their schedule."""
    if not card_types:
        return
    conn.execute(
        "insert into cards (user_id, item_id, card_type) "
        "select %s, %s, unnest(%s::card_type[]) on conflict (item_id, card_type) do nothing",
        (user_id, item_id, card_types),
    )


def ensure_later(
    conn: Connection[DictRow], user_id: UUID, item_id: UUID, card_type: str, delay_days: int
) -> None:
    """Create a card first due `delay_days` from now; an existing card keeps its schedule."""
    conn.execute(
        "insert into cards (user_id, item_id, card_type, due) "
        "values (%s, %s, %s::card_type, now() + make_interval(days => %s)) "
        "on conflict (item_id, card_type) do nothing",
        (user_id, item_id, card_type, delay_days),
    )

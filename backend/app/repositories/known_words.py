from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow


def lemmas_for_user(conn: Connection[DictRow], user_id: UUID) -> set[str]:
    rows = conn.execute("select lemma from known_words where user_id = %s", (user_id,)).fetchall()
    return {row["lemma"] for row in rows}


def add(conn: Connection[DictRow], user_id: UUID, lemmas: list[str]) -> int:
    """Insert lemmas, ignoring ones already known; return how many were new."""
    cursor = conn.execute(
        "insert into known_words (user_id, lemma) select %s, unnest(%s::text[]) "
        "on conflict do nothing",
        (user_id, lemmas),
    )
    return cursor.rowcount


def remove(conn: Connection[DictRow], user_id: UUID, lemma: str) -> bool:
    cursor = conn.execute(
        "delete from known_words where user_id = %s and lemma = %s", (user_id, lemma)
    )
    return cursor.rowcount == 1

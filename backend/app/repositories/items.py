from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow


def lemmas_for_user(conn: Connection[DictRow], user_id: UUID) -> set[str]:
    rows = conn.execute("select lemma from items where user_id = %s", (user_id,)).fetchall()
    return {row["lemma"] for row in rows}


def active_word_ids(conn: Connection[DictRow], user_id: UUID) -> dict[str, UUID]:
    """Lemma to item id for the learner's active single-word items."""
    rows = conn.execute(
        "select lemma, id from items where user_id = %s and type = 'word' and status = 'active'",
        (user_id,),
    ).fetchall()
    return {row["lemma"]: row["id"] for row in rows}


def find(conn: Connection[DictRow], user_id: UUID, item_type: str, lemma: str) -> UUID | None:
    row = conn.execute(
        "select id from items where user_id = %s and type = %s::item_type and lemma = %s",
        (user_id, item_type, lemma),
    ).fetchone()
    return row["id"] if row else None


def insert(
    conn: Connection[DictRow],
    user_id: UUID,
    item_type: str,
    term: str,
    lemma: str,
    definition: str | None,
    note: str | None,
) -> UUID:
    row = conn.execute(
        "insert into items (user_id, type, term, lemma, definition, note) "
        "values (%s, %s::item_type, %s, %s, %s, %s) returning id",
        (user_id, item_type, term, lemma, definition, note),
    ).fetchone()
    assert row is not None  # noqa: S101 - insert ... returning always yields a row
    item_id: UUID = row["id"]
    return item_id


def add_context(
    conn: Connection[DictRow],
    user_id: UUID,
    item_id: UUID,
    source_id: UUID | None,
    sentence: str,
    surface: str | None,
    written_by_learner: bool = False,
) -> None:
    conn.execute(
        "insert into item_contexts "
        "(user_id, item_id, source_id, sentence, surface, written_by_learner) "
        "values (%s, %s, %s, %s, %s, %s) on conflict (item_id, sentence) do nothing",
        (user_id, item_id, source_id, sentence, surface, written_by_learner),
    )


def add_tags(conn: Connection[DictRow], user_id: UUID, item_id: UUID, tags: list[str]) -> None:
    conn.execute(
        "insert into item_tags (user_id, item_id, tag) select %s, %s, unnest(%s::text[]) "
        "on conflict do nothing",
        (user_id, item_id, tags),
    )


def replace_tags(conn: Connection[DictRow], user_id: UUID, item_id: UUID, tags: list[str]) -> None:
    conn.execute("delete from item_tags where user_id = %s and item_id = %s", (user_id, item_id))
    add_tags(conn, user_id, item_id, tags)


def attach_dictionary(
    conn: Connection[DictRow], user_id: UUID, item_id: UUID, entry_id: int, definition: str | None
) -> bool:
    """Link a dictionary entry; never overwrite a definition the user wrote. True if filled."""
    row = conn.execute(
        "update items set dict_entry_id = %s, definition = coalesce(definition, %s), "
        "updated_at = now() where user_id = %s and id = %s returning definition",
        (entry_id, definition, user_id, item_id),
    ).fetchone()
    return row is not None and row["definition"] is not None


def update(
    conn: Connection[DictRow],
    user_id: UUID,
    item_id: UUID,
    definition: str | None,
    note: str | None,
    status: str,
) -> bool:
    cursor = conn.execute(
        "update items set definition = %s, note = %s, status = %s::item_status, "
        "updated_at = now() where user_id = %s and id = %s",
        (definition, note, status, user_id, item_id),
    )
    return cursor.rowcount == 1


def delete(conn: Connection[DictRow], user_id: UUID, item_id: UUID) -> bool:
    cursor = conn.execute("delete from items where user_id = %s and id = %s", (user_id, item_id))
    return cursor.rowcount == 1

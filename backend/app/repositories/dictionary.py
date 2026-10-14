from psycopg import Connection
from psycopg.rows import DictRow
from psycopg.types.json import Jsonb

from app.services.dictionary import DictionaryEntry


def get_by_lemma(conn: Connection[DictRow], lemma: str) -> DictRow | None:
    # Prefer a row that has a definition over a cached miss for the same lemma.
    return conn.execute(
        "select id, definition_en from dictionary_entries where lemma = %s "
        "order by (definition_en is null), id limit 1",
        (lemma,),
    ).fetchone()


def upsert(
    conn: Connection[DictRow], lemma: str, entry: DictionaryEntry | None, freq_rank: int | None
) -> DictRow:
    """Store a lookup result; a miss is stored too so we do not ask again for every save."""
    row = conn.execute(
        "insert into dictionary_entries (lemma, pos, definition_en, phonetic, examples, freq_rank) "
        "values (%s, %s, %s, %s, %s, %s) "
        "on conflict (lemma, pos) do update set definition_en = excluded.definition_en, "
        "phonetic = excluded.phonetic, examples = excluded.examples, updated_at = now() "
        "returning id, definition_en",
        (
            lemma,
            entry.pos if entry else "",
            entry.definition if entry else None,
            entry.phonetic if entry else None,
            Jsonb(entry.examples if entry else []),
            freq_rank,
        ),
    ).fetchone()
    assert row is not None  # noqa: S101 - upsert ... returning always yields a row
    return row

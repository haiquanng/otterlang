from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow


def list_for_user(conn: Connection[DictRow], user_id: UUID, kind: str | None) -> list[DictRow]:
    """Library texts with the id of the user's copy, if they already added it."""
    return conn.execute(
        """
        select d.id, d.title, d.kind, d.source_name, d.license, d.word_count, s.id as source_id
        from library_documents d
        left join sources s on s.library_document_id = d.id and s.user_id = %(user)s
        where (%(kind)s::source_kind is null or d.kind = %(kind)s::source_kind)
        order by d.kind, d.title
        """,
        {"user": user_id, "kind": kind},
    ).fetchall()


def copy_to_user(
    conn: Connection[DictRow], user_id: UUID, document_id: UUID
) -> tuple[UUID, bool] | None:
    """Return (source id, created). None when the library text does not exist."""
    row = conn.execute(
        """
        insert into sources (user_id, title, kind, url, body, library_document_id)
        select %(user)s, title, kind, url, body, id from library_documents where id = %(doc)s
        on conflict (user_id, library_document_id) where library_document_id is not null
        do nothing
        returning id
        """,
        {"user": user_id, "doc": document_id},
    ).fetchone()
    if row is not None:
        return row["id"], True
    existing = conn.execute(
        "select id from sources where user_id = %s and library_document_id = %s",
        (user_id, document_id),
    ).fetchone()
    return (existing["id"], False) if existing else None


def upsert(
    conn: Connection[DictRow],
    *,
    title: str,
    kind: str,
    url: str,
    body: str,
    source_name: str,
    license_name: str | None,
) -> bool:
    """Insert or refresh a library text by URL; True when it was new."""
    row = conn.execute(
        """
        insert into library_documents (title, kind, url, body, source_name, license, word_count)
        values (%s, %s::source_kind, %s, %s, %s, %s, %s)
        on conflict (url) do update set title = excluded.title, kind = excluded.kind,
          body = excluded.body, source_name = excluded.source_name,
          license = excluded.license, word_count = excluded.word_count
        returning (xmax = 0) as inserted
        """,
        (title, kind, url, body, source_name, license_name, len(body.split())),
    ).fetchone()
    return bool(row and row["inserted"])

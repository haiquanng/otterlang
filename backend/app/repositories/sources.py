from typing import Literal
from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow

SourceKind = Literal["tech_blog", "ielts", "other"]


def create(
    conn: Connection[DictRow],
    user_id: UUID,
    title: str,
    kind: SourceKind,
    url: str | None,
    body: str,
) -> DictRow:
    row = conn.execute(
        "insert into sources (user_id, title, kind, url, body) values (%s, %s, %s, %s, %s) "
        "returning id, title, kind, url, body, created_at",
        (user_id, title, kind, url, body),
    ).fetchone()
    assert row is not None  # noqa: S101 - insert ... returning always yields a row
    return row


def list_for_user(conn: Connection[DictRow], user_id: UUID, limit: int) -> list[DictRow]:
    return conn.execute(
        "select id, title, kind, url, char_length(body) as char_count, created_at "
        "from sources where user_id = %s order by created_at desc limit %s",
        (user_id, limit),
    ).fetchall()


def get(conn: Connection[DictRow], user_id: UUID, source_id: UUID) -> DictRow | None:
    return conn.execute(
        "select id, title, kind, url, body, created_at from sources where user_id = %s and id = %s",
        (user_id, source_id),
    ).fetchone()


def update(
    conn: Connection[DictRow],
    user_id: UUID,
    source_id: UUID,
    title: str,
    kind: SourceKind,
    url: str | None,
    body: str,
) -> DictRow | None:
    return conn.execute(
        "update sources set title = %s, kind = %s, url = %s, body = %s "
        "where user_id = %s and id = %s returning id, title, kind, url, body, created_at",
        (title, kind, url, body, user_id, source_id),
    ).fetchone()


def delete(conn: Connection[DictRow], user_id: UUID, source_id: UUID) -> bool:
    cursor = conn.execute(
        "delete from sources where user_id = %s and id = %s", (user_id, source_id)
    )
    return cursor.rowcount == 1

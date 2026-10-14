from datetime import datetime
from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow

from app.models import RefreshToken


def insert(conn: Connection[DictRow], user_id: UUID, token_hash: str, expires_at: datetime) -> None:
    conn.execute(
        "insert into refresh_tokens (user_id, token_hash, expires_at) values (%s, %s, %s)",
        (user_id, token_hash, expires_at),
    )


def find_for_update(conn: Connection[DictRow], token_hash: str) -> RefreshToken | None:
    # Row lock so two concurrent refreshes with the same token cannot both rotate it.
    row = conn.execute(
        "select id, user_id, expires_at, revoked_at from refresh_tokens "
        "where token_hash = %s for update",
        (token_hash,),
    ).fetchone()
    return RefreshToken(**row) if row else None


def revoke(conn: Connection[DictRow], token_id: UUID) -> None:
    conn.execute(
        "update refresh_tokens set revoked_at = now() where id = %s and revoked_at is null",
        (token_id,),
    )


def revoke_all_for_user(conn: Connection[DictRow], user_id: UUID) -> None:
    conn.execute(
        "update refresh_tokens set revoked_at = now() where user_id = %s and revoked_at is null",
        (user_id,),
    )

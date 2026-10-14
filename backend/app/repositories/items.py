from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow


def lemmas_for_user(conn: Connection[DictRow], user_id: UUID) -> set[str]:
    rows = conn.execute("select lemma from items where user_id = %s", (user_id,)).fetchall()
    return {row["lemma"] for row in rows}

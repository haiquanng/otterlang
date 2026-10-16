from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow

# Longer sentences are hard to repeat in one breath; leave them to reading.
MAX_CHARS = 200


def practice_sentences(conn: Connection[DictRow], user_id: UUID, limit: int) -> list[DictRow]:
    """The learner's own sentences first, newest first, then saved contexts in random order."""
    return conn.execute(
        "select c.id, c.item_id, i.term, c.sentence, c.written_by_learner as mine "
        "from item_contexts c join items i on i.id = c.item_id and i.status = 'active' "
        "where c.user_id = %s and char_length(c.sentence) <= %s "
        "order by c.written_by_learner desc, "
        "case when c.written_by_learner then c.created_at end desc, random() "
        "limit %s",
        (user_id, MAX_CHARS, limit),
    ).fetchall()

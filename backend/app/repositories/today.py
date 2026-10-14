from datetime import datetime
from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow


def counts(
    conn: Connection[DictRow],
    user_id: UUID,
    now: datetime,
    end_of_day: datetime,
    week_ago: datetime,
) -> DictRow:
    """Due now, due later today, words saved in the last 7 days, total active words."""
    row = conn.execute(
        """
        select
          count(*) filter (where c.due <= %(now)s) as due_now,
          count(*) filter (where c.due > %(now)s and c.due <= %(end)s) as due_later_today,
          (select count(*) from items where user_id = %(user)s and status = 'active'
             and created_at >= %(week_ago)s) as new_this_week,
          (select count(*) from items where user_id = %(user)s and status = 'active') as total_words
        from cards c
        join items i on i.id = c.item_id and i.status = 'active'
        where c.user_id = %(user)s
        """,
        {"user": user_id, "now": now, "end": end_of_day, "week_ago": week_ago},
    ).fetchone()
    assert row is not None  # noqa: S101 - an aggregate always returns one row
    return row

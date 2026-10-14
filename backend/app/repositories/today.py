from datetime import date, datetime
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


MASTERED_STABILITY_DAYS = 21


def mastered_words(conn: Connection[DictRow], user_id: UUID) -> int:
    """Active items with a card in long-term review (FSRS stability of 3+ weeks)."""
    row = conn.execute(
        "select count(distinct c.item_id) as n from cards c "
        "join items i on i.id = c.item_id and i.status = 'active' "
        "where c.user_id = %s and c.state = 'review' and c.stability >= %s",
        (user_id, MASTERED_STABILITY_DAYS),
    ).fetchone()
    return int(row["n"]) if row else 0


def reviews_by_day(
    conn: Connection[DictRow], user_id: UUID, since: datetime, tz_name: str
) -> dict[date, int]:
    """Reviews per local calendar day since `since` (a UTC instant)."""
    rows = conn.execute(
        "select (reviewed_at at time zone %s)::date as day, count(*) as n from review_logs "
        "where user_id = %s and reviewed_at >= %s group by day",
        (tz_name, user_id, since),
    ).fetchall()
    return {row["day"]: int(row["n"]) for row in rows}

from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow


def upsert(conn: Connection[DictRow], user_id: UUID, endpoint: str, p256dh: str, auth: str) -> None:
    # A browser endpoint belongs to whoever subscribed it last on that device.
    conn.execute(
        "insert into push_subscriptions (user_id, endpoint, p256dh, auth) "
        "values (%s, %s, %s, %s) on conflict (endpoint) do update set "
        "user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth",
        (user_id, endpoint, p256dh, auth),
    )


def remove(conn: Connection[DictRow], user_id: UUID, endpoint: str) -> None:
    conn.execute(
        "delete from push_subscriptions where user_id = %s and endpoint = %s",
        (user_id, endpoint),
    )


def remove_endpoint(conn: Connection[DictRow], endpoint: str) -> None:
    conn.execute("delete from push_subscriptions where endpoint = %s", (endpoint,))


def for_user(conn: Connection[DictRow], user_id: UUID) -> list[DictRow]:
    return conn.execute(
        "select endpoint, p256dh, auth from push_subscriptions where user_id = %s", (user_id,)
    ).fetchall()

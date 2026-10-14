from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request
from psycopg import Connection
from psycopg.rows import DictRow, dict_row
from psycopg_pool import ConnectionPool

Pool = ConnectionPool[Connection[DictRow]]


def create_pool(database_url: str) -> Pool:
    return ConnectionPool(
        database_url,
        connection_class=Connection[DictRow],
        # prepare_threshold=None keeps Supabase's transaction pooler (port 6543) usable.
        kwargs={"row_factory": dict_row, "prepare_threshold": None},
        min_size=1,
        max_size=5,
        open=False,
    )


def get_conn(request: Request) -> Iterator[Connection[DictRow]]:
    """One transaction per request: commits on success, rolls back on error."""
    pool: Pool = request.app.state.pool
    with pool.connection() as conn:
        yield conn


Conn = Annotated[Connection[DictRow], Depends(get_conn)]

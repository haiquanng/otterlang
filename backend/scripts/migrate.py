"""Apply db/migrations/*.sql in filename order, each exactly once.

Run from backend/: python -m scripts.migrate
"""

from pathlib import Path
from typing import Any

import psycopg

from app.config import get_settings

MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "db" / "migrations"


def apply_migrations(conn: psycopg.Connection[Any]) -> list[str]:
    """Apply pending migrations inside the caller's transaction; return their names."""
    conn.execute(
        "create table if not exists schema_migrations ("
        "name text primary key, applied_at timestamptz not null default now())"
    )
    conn.execute("alter table schema_migrations enable row level security")
    applied = {row[0] for row in conn.execute("select name from schema_migrations").fetchall()}
    pending = [p for p in sorted(MIGRATIONS_DIR.glob("*.sql")) if p.name not in applied]
    for path in pending:
        # Bytes, not str: a migration file is trusted repo content, not user input.
        conn.execute(path.read_bytes())
        conn.execute("insert into schema_migrations (name) values (%s)", (path.name,))
    return [p.name for p in pending]


def main() -> None:
    with psycopg.connect(get_settings().database_url) as conn:
        applied = apply_migrations(conn)
    for name in applied:
        print(f"applied {name}")
    if not applied:
        print("nothing to apply")


if __name__ == "__main__":
    main()

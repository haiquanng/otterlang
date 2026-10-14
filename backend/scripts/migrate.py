"""Apply db/migrations/*.sql in filename order, each exactly once.

Run from backend/: python -m scripts.migrate
"""

from pathlib import Path

import psycopg

from app.config import get_settings

MIGRATIONS_DIR = Path(__file__).resolve().parents[2] / "db" / "migrations"


def main() -> None:
    settings = get_settings()
    with psycopg.connect(settings.database_url) as conn:
        conn.execute(
            "create table if not exists schema_migrations ("
            "name text primary key, applied_at timestamptz not null default now())"
        )
        applied = {row[0] for row in conn.execute("select name from schema_migrations")}
        pending = [p for p in sorted(MIGRATIONS_DIR.glob("*.sql")) if p.name not in applied]
        for path in pending:
            # Bytes, not str: a migration file is trusted repo content, not user input.
            conn.execute(path.read_bytes())
            conn.execute("insert into schema_migrations (name) values (%s)", (path.name,))
            print(f"applied {path.name}")
        if not pending:
            print("nothing to apply")


if __name__ == "__main__":
    main()

# Backend (FastAPI)

Loaded when working under `backend/`. Root `CLAUDE.md` and `.claude/rules/` still apply.

## Commands (run from `backend/`)
- Setup: `python3.12 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt`
- Dev server: `.venv/bin/uvicorn app.main:app --reload`
- Tests: `.venv/bin/pytest`
- Lint/format: `.venv/bin/ruff check . && .venv/bin/ruff format --check .`
- Types: `.venv/bin/mypy app scripts`
- Migrate: `.venv/bin/python -m scripts.migrate` (applies `../db/migrations/*.sql`)

## Layout
- `app/main.py` app factory, middleware, router wiring
- `app/config.py` settings from env (`.env` locally, Render env in prod)
- `app/routers/` HTTP only: parse input, call a service, shape output
- `app/services/` logic (extraction, grading, scheduling); pure where possible
- `app/repositories/` SQL with psycopg; every user-owned query takes `user_id`
- `scripts/` owner-only CLIs: migrate, seeding/crawl
- `tests/` pytest; `conftest.py` sets fake env so tests never need a real `.env`

## Notes
- Database is Supabase Postgres used as plain Postgres. Use the session pooler (port 5432) for migrations; if the app uses the transaction pooler (port 6543), connect with `prepare_threshold=None`.
- Raw SQL with psycopg, no ORM. Pass queries as literal strings with `%s` params, never f-strings.
- Render free tier: 512MB RAM, ephemeral disk, sleeps when idle. `/health` must stay database-free.

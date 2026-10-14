# OtterLang

Personal English learning app: paste real content, pick the words worth learning, review them with spaced repetition and production cards.

## Structure
| Path | What |
|---|---|
| `frontend/` | React + TypeScript PWA (Vite, Tailwind), deployed on Vercel |
| `backend/` | FastAPI API, deployed on Render |
| `db/migrations/` | Postgres schema (Supabase Postgres) |
| `.claude/` | Product docs and rules for Claude Code |

## Local setup
```bash
# backend
cd backend
python3.12 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cp .env.example .env   # fill DATABASE_URL and JWT_SECRET
.venv/bin/python -m scripts.migrate
.venv/bin/uvicorn app.main:app --reload

# frontend
cd frontend
npm install
cp .env.example .env
npm run dev
```

Product and data model: [.claude/docs/prd.md](.claude/docs/prd.md). Design guide: [.claude/docs/design.md](.claude/docs/design.md).

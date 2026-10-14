# OtterLang

Personal English learning app for a Vietnamese software engineer (intermediate level, goals: technical communication, presentations, IELTS). Learns from real content (tech blogs, IELTS reading), saves words, reviews with spaced repetition. Single user for the first month, friends and family later.

## Product decisions (do not relitigate without asking)
- Content-first: the learner pastes text, picks words worth learning, reviews them later.
- English first. UI is English. No Vietnamese translations generated; the learner uses Google Translate or a dictionary link when needed.
- No AI in the core loop. Word extraction is deterministic (lemma + frequency + CEFR + the learner's known words). AI is optional, behind one function, cached and rate limited: sentence feedback, grammar explanation on request, filling a missing definition.
- Cards force production (cloze, typed answer, write a sentence), not passive flipping.
- Per-user personalization: known words, skip threshold, tags. Nothing is shared between users except the dictionary cache and admin-seeded content.
- Crawling is a seeding tool for the owner only (CLI script, no CMS yet). End users do CRUD on their own words and documents.
- Experience matters most. Priority: web desktop, then responsive mobile, then PWA. See `.claude/docs/design.md`.
- Out of scope for now: grammar curriculum, IELTS mock tests, pronunciation scoring, chat tutor, full offline, the calendar/planner app (separate project).

## Stack
- Frontend: Vite + React + TypeScript + Tailwind v4, `vite-plugin-pwa`, TanStack Query, React Router. Hosted on Vercel.
- Backend: FastAPI (Python 3.12), psycopg, raw SQL. Hosted on Render free tier, kept awake by a cron ping to `/health`.
- Database: Supabase Postgres used as plain Postgres (no Supabase Auth, no Supabase client anywhere).
- Auth: own email + password in FastAPI (argon2id, short-lived JWT, revocable refresh token).
- Text processing: `trafilatura`, `wordfreq`, `lemminflect`. No large NLP models (512MB RAM).
- Scheduling: FSRS.
- Tests: pytest, Vitest, Playwright.

## Layout (monorepo)
- `frontend/` PWA. Has its own `CLAUDE.md` with commands.
- `backend/` FastAPI app, tests, owner scripts. Has its own `CLAUDE.md` with commands.
- `db/migrations/` numbered SQL files, applied by `backend/scripts/migrate.py`.
- `render.yaml` Render blueprint for the backend.
- `.claude/` shared rules, docs, and later agents and skills for the whole repo.

Area-specific instructions go in `frontend/CLAUDE.md` or `backend/CLAUDE.md` (loaded when working there). Agents, skills and settings stay in the root `.claude/` unless a skill only makes sense inside one area.

## Working rules
- Frontend calls FastAPI only. FastAPI talks to the database. Authorization lives in the backend: every user-owned query is filtered by `user_id`.
- Schema first. Update `.claude/docs/prd.md` and add a migration in `db/migrations/` before code that depends on it.
- Validate every external input with Pydantic (backend) or Zod (frontend).
- Never trust crawled or pasted content.
- Ship speed over infrastructure. No queues, microservices or abstractions without a concrete need.
- Git flow: work on `feat/<name>` or `fix/<name>`, commit, push, open a PR. Never merge, never push to `main`, never force-push, never tag.
- Secrets only in env vars (`backend/.env`, `frontend/.env`). Never commit them.
- Verify before saying done: lint, typecheck, tests in the area you touched, and for UI a look at 390px and desktop widths.
- Concise commit messages and replies.

## Where to read more
- Product and data model: `.claude/docs/prd.md`
- UI/UX: `.claude/docs/design.md`
- Rules: `.claude/rules/`

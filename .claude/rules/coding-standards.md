# Coding standards

## Both
- Files under about 200 lines. One public thing per file, named after it.
- No dead code, no commented-out code, no TODO without a note in the PRD or an issue.
- Comments explain why, not what.
- Small pure functions for logic (extraction, grading, scheduling) so they are unit-testable.
- Dates stored as UTC `timestamptz`, shown in the user's timezone.

## Backend (Python)
- Python 3.12, type hints everywhere, `mypy --strict` clean on `app/`.
- Pydantic models for every request and response body. Settings via `pydantic-settings`.
- Layers: routers (HTTP only) → services (logic) → repositories (SQL). No SQL in routers.
- Format and lint with `ruff`.

## Frontend (TypeScript)
- Strict mode. No `any`; use `unknown` and narrow.
- React function components and hooks. Server state via TanStack Query, local state via `useState`.
- Validate API responses with Zod.
- Handle loading, empty, error and server-waking states on every screen.
- Imports use the `@/` alias for `src/`.
- UI text lives in one i18n map, not in components.

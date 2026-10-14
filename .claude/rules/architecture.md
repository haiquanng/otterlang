# Architecture rules

Full detail in `.claude/docs/prd.md`. Hard rules:

- Frontend talks only to FastAPI through one `frontend/src/lib/api.ts`. Components never call `fetch` directly.
- FastAPI is the only thing that touches the database. Every user-owned query filters by the authenticated `user_id`; there is no code path that reads another user's rows.
- Candidate extraction is deterministic and pure: lemma, frequency rank, CEFR, known words. It must not call AI or the network.
- Saving a document or item never depends on enrichment. A failed dictionary lookup leaves the item saved with the user's own note.
- The dictionary cache is shared and has no `user_id`. Everything else has one.
- AI is reached through a single backend function with caching and per-user rate limits. The app must work with AI disabled.
- Crawling lives in `backend/scripts/` and is run by the owner. No public crawl endpoint.
- FSRS scheduling is a pure function: card state + rating + now in, new card state out.
- No new service, queue or cron host unless Render and Postgres cannot do it.

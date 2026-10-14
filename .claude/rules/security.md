# Security rules

- Never commit secrets. `.env*` is ignored; `.env.example` lists names only.
- Passwords: argon2id. Never log passwords, tokens or full request bodies.
- Access JWT is short-lived. Refresh tokens are random, stored hashed, revocable, rotated on use.
- Rate limit login, signup and AI endpoints per IP and per user.
- `SIGNUP_ENABLED` defaults to false.
- Every user-owned query is filtered by `user_id` from the verified token, never from the request body.
- Treat all documents and crawled text as untrusted: escape on render, no `dangerouslySetInnerHTML`.
- Server-side fetching (crawl script): http/https only, block private and loopback ranges, 5s and 1MB caps.
- Database credentials and AI keys exist only in backend env vars. The Supabase anon and service keys are not used by this app and never go in the frontend.
- Every new table gets `enable row level security` with no policies, so Supabase's auto-generated REST API cannot read it.
- CORS allows only the known frontend origins.

# PRD: OtterLang

## 1. Vision
Turn real English content (technical blogs, IELTS Reading passages) into personal knowledge and reviews it at the right time, with cards that make the learner produce English instead of only flipping.

Principles: English first, translate on demand · no AI in the core loop · everything personalized per user · daily use, not streak pressure.

## 2. Users
- Primary: the owner. Software engineer, intermediate English, goals: technical communication, presentations, IELTS.
- Secondary (later): friends and family, each with their own account, known words and reviews.
- Not public. Single user for the first month.

## 3. MVP scope
In:
1. Email + password signup/login (own implementation).
2. Add a document: paste text (URL import is a later convenience).
3. Candidate extraction from a document. Each candidate: Save / Known / Skip.
4. Quick-add a word or phrase, definition filled from the dictionary cache.
5. FSRS review with production cards.
6. Today screen: cards due, start review.
7. Knowledge list: search by term, filter by source and tag, edit, delete.

Out: grammar curriculum, IELTS mock tests, pronunciation scoring, chat tutor, full offline, CMS for seeding, planner app.

## 4. Seeding (owner only)
Crawling enriches the shared database at the start: dictionary entries, sample documents. It is a CLI script in `backend/scripts/`, run by the owner. No admin UI until it is needed. End users never trigger a crawl.

**Starter library:** `scripts/seed_library.py` imports the list in `scripts/seed_library.json` into the shared `library_documents` table: Wikipedia articles through the official API (CC BY-SA, attribution stored) for technical and IELTS-style topics, plus any URL through `trafilatura` under the SSRF rules. Open-licensed journalism comes first because encyclopedia text proved dry: The Conversation (CC BY-ND 4.0, license stored per entry) for AI/ML, medicine and IELTS-style topics. Copyrighted material (IELTS books, paid blogs) is not imported for redistribution. A learner adds a library text to their own documents with one tap; it is a copy, so they can edit or delete it freely. New accounts see the library on Today and in empty Documents.

## 5. Main flow
1. Add document (paste text).
2. Backend lemmatizes, removes stopwords, drops words in the user's known list or above their frequency threshold, returns candidates with source sentences.
3. User marks each candidate: Save (creates item + cards), Known (never suggested again), Skip (this time only). Bulk "mark the rest as known".
4. Review: due cards, user answers, grading, FSRS updates schedule.
5. Translate on demand via external link from the card.

## 6. Personalization
- `skip_top_n`: ignore the N most frequent words when suggesting (default about 3000, per user).
- `daily_goal`: reviews per day; Today shows progress toward it, the last 7 days, and words mastered (a card in long-term review, stability of 21+ days). No streaks.
- `known_words` per user.
- Tags: technical, ielts, general. An item can carry several.

## 7. Card types
| Type | Interaction | Grading |
|---|---|---|
| Cloze | Source sentence with the word hidden, type it | Match, allow lemma variants |
| Define to word | English definition shown, type the word | Match |
| Word in use | Pick the sentence using the word correctly | Multiple choice, for collocations |
| Write sentence | Write a sentence with the word; first due 3 days after saving | Checks: uses a form of the word, at least 5 words, capital start, end punctuation; then self-rated. The sentence is kept as an example. AI feedback optional, later |

## 8. Data model
Source of truth: `db/migrations/`. Every user-owned table carries `user_id` (including child tables) so each query filters directly.

- `users(id, email citext unique, password_hash, display_name, skip_top_n, daily_goal, is_admin, created_at)`; `daily_goal` = reviews per day (default 20); `reminder_enabled`, `reminder_hour` (local, 0-23), `timezone` (IANA), `last_reminded_on` (local date) for daily reminders
- `push_subscriptions(id, user_id, endpoint unique, p256dh, auth, created_at)`: one Web Push subscription per device
- `refresh_tokens(id, user_id, token_hash, expires_at, revoked_at)`
- `sources(id, user_id, title, url, body, kind[tech_blog|ielts|other], created_at)`
- `dictionary_entries(lemma, pos, definition_en, phonetic, examples jsonb, freq_rank, cefr)` shared cache
- `items(id, user_id, type[word|collocation|pattern], term, lemma, dict_entry_id?, definition, note, status, created_at, updated_at)`; unique `(user_id, type, lemma)`
- `item_contexts(id, user_id, item_id, source_id, sentence, surface, written_by_learner)`: `surface` is the exact form in the sentence (e.g. "Invalidating" for lemma "invalidate"), used to blank it out on cloze cards. `written_by_learner` marks sentences from writing cards (shown as "Your sentences", never used for cloze). Unique `(item_id, sentence)`.
- `item_tags(user_id, item_id, tag)`
- `known_words(user_id, lemma)`
- `cards(id, user_id, item_id, card_type, due, stability, difficulty, state, step, reps, lapses, last_review)`; unique `(item_id, card_type)`. Scheduling uses the `fsrs` library (py-fsrs 6); `step` is its learning-step index, null in the review state.
- `review_logs(id, user_id, card_id, rating, correct, response_ms, reviewed_at)`
- `library_documents(id, title, kind, url unique, body, source_name, license, word_count, created_at)` shared, owner-curated; `sources.library_document_id` remembers which library text a user copied (unique per user).

Authorization is enforced in the backend. RLS is enabled with no policies on every table only to close Supabase's auto-generated REST API; the backend connects as the owner role and is not affected.

## 9. API (FastAPI)
- `POST /auth/signup` (gated by `SIGNUP_ENABLED`), `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `POST /sources`, `GET /sources/{id}/candidates`
- `POST /items`, `POST /items/quick-add`, `GET /items`, `PATCH /items/{id}`, `DELETE /items/{id}`
- `POST /known-words`, `POST /known-words/bulk`
- `GET /review/due`, `POST /review/{card_id}/answer`
- `GET /today`, `GET /me`, `PATCH /me`
- `POST /ai/feedback` (optional, rate limited)
- `GET /health`

## 10. Operations
- Daily reminders: cron-job.org calls `POST /push/run` hourly with the `X-Reminder-Secret` header. Learners whose local reminder hour has passed today, who have cards due and were not reminded today, get one Web Push notification per device. Expired subscriptions (404/410) are deleted. Needs `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `REMINDER_SECRET`.
- Frontend on Vercel (root directory `frontend/`).
- FastAPI on Render free (`render.yaml`), cron pings `/health` about every 10 minutes. Frontend shows a waking-up state on cold start.
- No local file writes (ephemeral filesystem).
- Supabase Postgres via the pooler connection string.

## 11. Security
- Passwords hashed with argon2id. Short-lived access JWT, refresh token stored hashed and revocable.
- Rate limit login, signup and AI endpoints.
- Signup disabled by default (`SIGNUP_ENABLED=false`) until friends are invited.
- Crawler (admin script) blocks private/loopback ranges, http/https only, 5s and 1MB caps.
- Saved content is untrusted: escape on render, never `dangerouslySetInnerHTML`.
- Secrets only in Render env vars.

## 12. Success criteria
- One document to selected words to first review in under 3 minutes.
- Used at least 5 days a week for 3 weeks in a row without forcing it.
- Known-word list grows steadily, meaning the candidate filter fits the learner.

## 13. First slice (about 24h)
Auth, paste text, candidates with Save/Known, cloze and typed cards with FSRS, Today, deploy to Render with cron ping.

## 14. Decided
- UI language: English.
- Frontend hosting: Vercel.
- Priority: web desktop, then responsive, then PWA.

## 15. Open questions
- Password reset flow: needed before inviting friends (email provider required).

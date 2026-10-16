-- AI feedback on sentences written on writing cards. One row per (user, word, sentence):
-- it is the cache (asking again costs nothing) and, by created_at, the daily usage count.
-- Per user because the sentence is the learner's own text.
create table ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  lemma text not null,
  sentence_hash text not null,
  feedback jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, lemma, sentence_hash)
);
create index ai_feedback_user_created_idx on ai_feedback (user_id, created_at);

alter table ai_feedback enable row level security;

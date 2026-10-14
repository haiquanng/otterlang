-- Initial schema. See .claude/docs/prd.md section 8.
-- Auth is our own (not Supabase Auth), so authorization lives in the backend.
-- RLS is still enabled with no policies on every table: that blocks Supabase's
-- auto-generated REST API (anon key) while the backend's owner role bypasses it.

create extension if not exists citext;

create table users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash text not null,
  display_name text,
  skip_top_n integer not null default 3000 check (skip_top_n >= 0),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index refresh_tokens_user_idx on refresh_tokens (user_id);

create type source_kind as enum ('tech_blog', 'ielts', 'other');

create table sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  title text not null,
  url text,
  body text not null,
  kind source_kind not null default 'other',
  created_at timestamptz not null default now()
);
create index sources_user_created_idx on sources (user_id, created_at desc);

-- Shared cache, no user_id: one lookup serves every user.
create table dictionary_entries (
  id bigint generated always as identity primary key,
  lemma text not null,
  pos text not null default '',
  definition_en text,
  phonetic text,
  examples jsonb not null default '[]',
  freq_rank integer,
  cefr text check (cefr in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  updated_at timestamptz not null default now(),
  unique (lemma, pos)
);

create type item_type as enum ('word', 'collocation', 'pattern');
create type item_status as enum ('active', 'archived');

create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  type item_type not null,
  term text not null,
  lemma text not null,
  dict_entry_id bigint references dictionary_entries (id) on delete set null,
  definition text,
  note text,
  status item_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type, lemma)
);

create table item_contexts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  item_id uuid not null references items (id) on delete cascade,
  source_id uuid references sources (id) on delete set null,
  sentence text not null,
  created_at timestamptz not null default now()
);
create index item_contexts_item_idx on item_contexts (item_id);

create table item_tags (
  user_id uuid not null references users (id) on delete cascade,
  item_id uuid not null references items (id) on delete cascade,
  tag text not null check (tag in ('technical', 'ielts', 'general')),
  primary key (item_id, tag)
);

create table known_words (
  user_id uuid not null references users (id) on delete cascade,
  lemma text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, lemma)
);

create type card_type as enum ('cloze', 'define_to_word', 'word_in_use', 'write_sentence');
create type card_state as enum ('new', 'learning', 'review', 'relearning');

create table cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  item_id uuid not null references items (id) on delete cascade,
  card_type card_type not null,
  due timestamptz not null default now(),
  stability double precision not null default 0,
  difficulty double precision not null default 0,
  state card_state not null default 'new',
  reps integer not null default 0,
  lapses integer not null default 0,
  last_review timestamptz,
  unique (item_id, card_type)
);
create index cards_user_due_idx on cards (user_id, due);

create table review_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  card_id uuid not null references cards (id) on delete cascade,
  rating smallint not null check (rating between 1 and 4),
  correct boolean,
  response_ms integer check (response_ms >= 0),
  reviewed_at timestamptz not null default now()
);
create index review_logs_user_reviewed_idx on review_logs (user_id, reviewed_at desc);

alter table users enable row level security;
alter table refresh_tokens enable row level security;
alter table sources enable row level security;
alter table dictionary_entries enable row level security;
alter table items enable row level security;
alter table item_contexts enable row level security;
alter table item_tags enable row level security;
alter table known_words enable row level security;
alter table cards enable row level security;
alter table review_logs enable row level security;

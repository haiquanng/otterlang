-- Shared starter library curated by the owner (scripts/seed_library.py). No user_id:
-- every learner can read it; adding one copies it into their own sources.
create table library_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind source_kind not null,
  url text not null unique,
  body text not null,
  source_name text not null,
  license text,
  word_count integer not null check (word_count >= 0),
  created_at timestamptz not null default now()
);
create index library_documents_kind_idx on library_documents (kind, title);

alter table library_documents enable row level security;

-- Which library text a source was copied from, so adding twice returns the same copy.
alter table sources
  add column library_document_id uuid references library_documents (id) on delete set null;
create unique index sources_user_library_document_key
  on sources (user_id, library_document_id) where library_document_id is not null;

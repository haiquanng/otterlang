-- Daily reminder preferences. The hourly job compares the learner's local time
-- (timezone + reminder_hour) and sends at most one reminder per local day.
alter table users
  add column reminder_enabled boolean not null default false,
  add column reminder_hour smallint not null default 19 check (reminder_hour between 0 and 23),
  add column timezone text not null default 'UTC',
  add column last_reminded_on date;

-- One row per device that allowed notifications (Web Push subscription).
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

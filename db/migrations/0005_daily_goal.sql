-- Reviews per day the learner aims for; drives the progress ring on Today.
alter table users add column daily_goal integer not null default 20
  check (daily_goal between 1 and 200);

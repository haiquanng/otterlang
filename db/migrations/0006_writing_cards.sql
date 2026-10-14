-- Sentences the learner wrote on a writing card are kept as examples, shown apart
-- from sentences that came from documents.
alter table item_contexts
  add column written_by_learner boolean not null default false;

-- Every existing active item gets a writing card, first due tomorrow so the first
-- review session after this change is not flooded.
insert into cards (user_id, item_id, card_type, due)
select user_id, id, 'write_sentence', now() + interval '1 day'
from items
where status = 'active'
on conflict (item_id, card_type) do nothing;

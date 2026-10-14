-- Cloze cards blank out the word as it appears in the sentence, which may be an
-- inflection of the lemma ("Invalidating" vs "invalidate"). Null when unknown.
alter table item_contexts add column surface text;

-- Saving the same word from the same sentence twice must not duplicate the context.
alter table item_contexts add constraint item_contexts_item_sentence_key unique (item_id, sentence);

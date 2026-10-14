-- py-fsrs 6 tracks the current learning/relearning step; null while in the review state.
alter table cards add column step integer check (step >= 0);

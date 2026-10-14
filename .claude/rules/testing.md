# Testing rules

- Unit tests for pure logic first: candidate extraction (lemma, frequency filter, known words), answer grading with lemma variants, FSRS scheduling, URL/text cleaning.
- Integration (pytest + a test database): user A cannot read or modify user B's items; duplicate `(user_id, type, lemma)` does not create a second row; marking a word known removes it from future candidates.
- No e2e or UI tests: the owner checks UI and UX by hand at 390px and desktop widths.
- Mock network and AI calls. Tests never hit real sites, dictionary APIs or an AI provider.
- A bug fix starts with a failing test that reproduces it.
- Do not chase coverage numbers; cover behavior listed in the PRD.

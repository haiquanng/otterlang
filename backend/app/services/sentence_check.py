"""Checks for a sentence the learner writes with a target word. Pure, deterministic, no AI."""

import re
from dataclasses import dataclass, field

from app.services.grading import accepted_answers

MIN_WORDS = 5
_WORD = re.compile(r"[A-Za-z]+(?:['\N{RIGHT SINGLE QUOTATION MARK}-][A-Za-z]+)*")
_END = (".", "!", "?", "\N{HORIZONTAL ELLIPSIS}")


@dataclass(frozen=True)
class SentenceFeedback:
    uses_word: bool
    # Machine-readable codes; the frontend turns them into advice.
    issues: list[str] = field(default_factory=list)
    suggested_rating: int = 3

    @property
    def ok(self) -> bool:
        return self.uses_word and not self.issues


def _uses_word(sentence: str, lemma: str, surface: str | None) -> bool:
    forms = accepted_answers(lemma, surface)
    if " " in lemma:
        # A phrase counts when it appears as a whole, in any letter case.
        flattened = " ".join(sentence.lower().split())
        return any(form in flattened for form in forms)
    words = {
        w.lower().replace("\N{RIGHT SINGLE QUOTATION MARK}", "'") for w in _WORD.findall(sentence)
    }
    return bool(words & forms)


def check_sentence(sentence: str, lemma: str, surface: str | None = None) -> SentenceFeedback:
    text = sentence.strip()
    uses = _uses_word(text, lemma, surface)
    issues: list[str] = []
    if not uses:
        issues.append("missing_word")
    if len(_WORD.findall(text)) < MIN_WORDS:
        issues.append("too_short")
    if text and not text[0].isupper():
        issues.append("no_capital")
    if text and not text.endswith(_END):
        issues.append("no_end_punctuation")
    if not uses:
        rating = 1
    elif not issues:
        rating = 3
    else:
        rating = 2
    return SentenceFeedback(uses_word=uses, issues=issues, suggested_rating=rating)

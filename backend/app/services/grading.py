"""Answer checking and cloze prompts. Pure functions, no database."""

import re
from dataclasses import dataclass

from lemminflect import getAllInflections

BLANK = "_____"
_QUOTES = str.maketrans(
    {"\N{RIGHT SINGLE QUOTATION MARK}": "'", "\N{LEFT SINGLE QUOTATION MARK}": "'"}
)


@dataclass(frozen=True)
class Grade:
    correct: bool
    close: bool  # one typo away: shown as "almost", counted wrong but rated Hard by default
    expected: str
    suggested_rating: int


def _normalize(text: str) -> str:
    return " ".join(text.translate(_QUOTES).lower().split())


def accepted_answers(lemma: str, surface: str | None) -> set[str]:
    """The lemma, the form seen in the sentence, and every inflection of a single word."""
    answers = {_normalize(lemma)}
    if surface:
        answers.add(_normalize(surface))
    if " " not in lemma:
        for forms in getAllInflections(lemma).values():
            answers.update(_normalize(str(form)) for form in forms)
    return answers


def _edit_distance(a: str, b: str) -> int:
    previous = list(range(len(b) + 1))
    for i, char_a in enumerate(a, start=1):
        current = [i]
        for j, char_b in enumerate(b, start=1):
            current.append(
                min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (char_a != char_b))
            )
        previous = current
    return previous[-1]


def suggest_rating(correct: bool, close: bool, response_ms: int | None) -> int:
    if not correct:
        return 2 if close else 1
    if response_ms is not None and response_ms < 4000:
        return 4
    if response_ms is None or response_ms < 15000:
        return 3
    return 2


def grade(answer: str, lemma: str, surface: str | None, response_ms: int | None) -> Grade:
    given = _normalize(answer)
    accepted = accepted_answers(lemma, surface)
    correct = given in accepted
    close = not correct and len(given) >= 5 and any(_edit_distance(given, a) == 1 for a in accepted)
    return Grade(
        correct=correct,
        close=close,
        expected=surface or lemma,
        suggested_rating=suggest_rating(correct, close, response_ms),
    )


def cloze(sentence: str, lemma: str, surface: str | None) -> str | None:
    """Blank out every form of the word in its sentence; None when none is found."""
    # Longest first so "invalidating" wins over "invalidate" at the same position.
    forms = sorted(accepted_answers(lemma, surface), key=len, reverse=True)
    alternatives = "|".join(re.escape(form) for form in forms)
    pattern = re.compile(rf"(?<![A-Za-z])(?:{alternatives})(?![A-Za-z])", re.IGNORECASE)
    blanked, count = pattern.subn(BLANK, sentence)
    return blanked if count else None

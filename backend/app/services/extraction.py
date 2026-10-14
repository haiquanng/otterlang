"""Deterministic word suggestions from a text. No network, no AI.

A word is suggested when it is a real English word (known to wordfreq), not among the
user's `skip_top_n` most frequent words, and not already known or saved by the user.
"""

import re
from dataclasses import dataclass, field
from functools import lru_cache

from lemminflect import getAllLemmas
from wordfreq import top_n_list, zipf_frequency

RANKED_WORDS = 50_000
# The most frequent words are never worth a card, whatever the user's threshold.
ALWAYS_SKIP_TOP = 500
MIN_LENGTH = 3
MAX_SENTENCE_CHARS = 300

_RSQUO = "\N{RIGHT SINGLE QUOTATION MARK}"
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+|\n+")
_WORD = re.compile("[A-Za-z]+(?:['" + _RSQUO + "-][A-Za-z]+)*")
_CAMEL = re.compile(r"[a-z][A-Z]")
_EDGE_PUNCT = (
    "\"'()[]{}<>,.;:!?*_`"
    "\N{LEFT DOUBLE QUOTATION MARK}\N{RIGHT DOUBLE QUOTATION MARK}"
    "\N{LEFT SINGLE QUOTATION MARK}" + _RSQUO
)


@dataclass(frozen=True)
class Candidate:
    lemma: str
    surface: str
    sentence: str
    rank: int | None
    count: int


@dataclass
class _Seen:
    surface: str
    sentence: str
    count: int = field(default=1)


@lru_cache(maxsize=1)
def _ranks() -> dict[str, int]:
    return {word: i + 1 for i, word in enumerate(top_n_list("en", RANKED_WORDS))}


def word_rank(word: str) -> int | None:
    """1 = most frequent English word; None when outside the ranked list."""
    return _ranks().get(word)


def lemmatize(word: str) -> str:
    """Pick the most common lemma among lemminflect's guesses (no POS tagger needed)."""
    options: set[str] = {
        str(lemma).lower() for lemmas in getAllLemmas(word).values() for lemma in lemmas
    }
    if not options:
        return word
    return max(options, key=lambda lemma: (zipf_frequency(lemma, "en"), -len(lemma)))


def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]


def _clean_tokens(sentence: str) -> list[str]:
    """Words worth considering, in order. Drops code, URLs, numbers, acronyms and names."""
    words: list[str] = []
    for position, chunk in enumerate(sentence.split()):
        token = chunk.strip(_EDGE_PUNCT)
        match = _WORD.fullmatch(token)
        if not match or len(token) < MIN_LENGTH:
            continue
        if _CAMEL.search(token) or (token.isupper() and len(token) > 1):
            continue
        # A capital letter mid-sentence usually means a name or product.
        if token[0].isupper() and position > 0:
            continue
        words.append(token.lower().replace(_RSQUO, "'"))
    return words


def extract_candidates(
    text: str,
    skip_top_n: int,
    known: set[str],
    saved: set[str],
    limit: int = 60,
) -> list[Candidate]:
    threshold = max(skip_top_n, ALWAYS_SKIP_TOP)
    seen: dict[str, _Seen] = {}

    for sentence in split_sentences(text):
        for surface in _clean_tokens(sentence):
            if zipf_frequency(surface, "en") == 0:
                continue
            lemma = lemmatize(surface)
            if lemma in known or lemma in saved or surface in known:
                continue
            rank = word_rank(lemma) or word_rank(surface)
            if rank is not None and rank <= threshold:
                continue
            if lemma in seen:
                seen[lemma].count += 1
            else:
                seen[lemma] = _Seen(surface=surface, sentence=sentence[:MAX_SENTENCE_CHARS])

    candidates = [
        Candidate(
            lemma=lemma,
            surface=entry.surface,
            sentence=entry.sentence,
            rank=word_rank(lemma) or word_rank(entry.surface),
            count=entry.count,
        )
        for lemma, entry in seen.items()
    ]
    # Rarest first; words outside the ranked list count as rarest.
    candidates.sort(key=lambda c: -(c.rank or RANKED_WORDS + 1))
    return candidates[:limit]

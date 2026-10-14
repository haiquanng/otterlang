"""Support for the interactive reading view: word lookup and highlighting saved words."""

import re
from dataclasses import dataclass
from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow

from app.repositories import dictionary
from app.services.dictionary import DictionaryUnavailableError, Fetch
from app.services.extraction import lemmatize, word_rank

_RSQUO = "\N{RIGHT SINGLE QUOTATION MARK}"
_WORD = re.compile("[A-Za-z]+(?:['" + _RSQUO + "-][A-Za-z]+)*")
MAX_WORD_LENGTH = 64
# Punctuation a tap on a word may carry along ("cache," or "(cache)").
_EDGE = (
    ".,;:!?\"'()[]{}*_`"
    "\N{LEFT DOUBLE QUOTATION MARK}\N{RIGHT DOUBLE QUOTATION MARK}"
    "\N{LEFT SINGLE QUOTATION MARK}" + _RSQUO
)


@dataclass(frozen=True)
class Definition:
    definition: str | None
    phonetic: str | None
    pos: str | None


def normalize_word(raw: str) -> str | None:
    """`raw` as one lowercase English word once edge punctuation is trimmed, else None."""
    token = raw.strip().strip(_EDGE)
    if len(token) > MAX_WORD_LENGTH or not _WORD.fullmatch(token):
        return None
    return token.lower().replace(_RSQUO, "'")


def saved_surfaces(text: str, saved: dict[str, UUID]) -> dict[str, UUID]:
    """Map each word form in `text` whose lemma is saved to that item, keyed lowercase.

    The frontend highlights by surface, so "Invalidating" lights up for a saved "invalidate".
    """
    found: dict[str, UUID] = {}
    seen: set[str] = set()
    for match in _WORD.finditer(text):
        surface = match.group(0).lower().replace(_RSQUO, "'")
        if surface in seen:
            continue
        seen.add(surface)
        item_id = saved.get(surface) or saved.get(lemmatize(surface))
        if item_id is not None:
            found[surface] = item_id
    return found


def define(conn: Connection[DictRow], fetch: Fetch, lemma: str) -> Definition:
    """Definition from the shared cache, fetching and caching it on a miss.

    An unreachable dictionary returns an empty definition and caches nothing,
    so a later lookup tries again.
    """
    cached = dictionary.get_by_lemma(conn, lemma)
    if cached is None:
        try:
            entry = fetch(lemma)
        except DictionaryUnavailableError:
            return Definition(definition=None, phonetic=None, pos=None)
        cached = dictionary.upsert(conn, lemma, entry, word_rank(lemma))
    return Definition(
        definition=cached["definition_en"], phonetic=cached["phonetic"], pos=cached["pos"] or None
    )

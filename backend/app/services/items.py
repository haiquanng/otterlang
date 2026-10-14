"""Saving library items. Insert first, enrich later: a dictionary failure never blocks a save."""

import re
from dataclasses import dataclass
from uuid import UUID

from psycopg import Connection
from psycopg.rows import DictRow

from app.db import Pool
from app.repositories import cards, dictionary, items
from app.services.dictionary import Fetch
from app.services.extraction import lemmatize, word_rank

_SPACES = re.compile(r"\s+")


@dataclass(frozen=True)
class NewItem:
    term: str
    item_type: str | None = None
    sentence: str | None = None
    surface: str | None = None
    source_id: UUID | None = None
    tags: tuple[str, ...] = ()
    definition: str | None = None
    note: str | None = None


@dataclass(frozen=True)
class SaveResult:
    item_id: UUID
    created: bool
    item_type: str
    lemma: str
    needs_definition: bool


def normalize_term(term: str) -> tuple[str, str, str]:
    """Return (clean term, item type, lemma). Multi-word terms are collocations."""
    clean = _SPACES.sub(" ", term.strip())
    if " " in clean:
        return clean, "collocation", clean.lower()
    return clean, "word", lemmatize(clean.lower())


def card_types_for(sentence: str | None, definition: str | None) -> list[str]:
    types = []
    if sentence:
        types.append("cloze")
    if definition:
        types.append("define_to_word")
    return types


def save_item(conn: Connection[DictRow], user_id: UUID, new: NewItem) -> SaveResult:
    term, inferred_type, lemma = normalize_term(new.term)
    item_type = new.item_type or inferred_type
    existing = items.find(conn, user_id, item_type, lemma)
    if existing is None:
        item_id = items.insert(conn, user_id, item_type, term, lemma, new.definition, new.note)
    else:
        item_id = existing
    items.add_tags(conn, user_id, item_id, list(new.tags))
    if new.sentence:
        items.add_context(conn, user_id, item_id, new.source_id, new.sentence, new.surface)
    cards.ensure(conn, user_id, item_id, card_types_for(new.sentence, new.definition))
    return SaveResult(
        item_id=item_id,
        created=existing is None,
        item_type=item_type,
        lemma=lemma,
        needs_definition=new.definition is None and item_type == "word",
    )


def enrich_item(pool: Pool, fetch: Fetch, user_id: UUID, item_id: UUID, lemma: str) -> None:
    """Fill the definition from the shared cache or the dictionary API. Runs after the response."""
    with pool.connection() as conn:
        cached = dictionary.get_by_lemma(conn, lemma)
    if cached is None:
        # Network call outside any transaction, so a slow API never holds a connection.
        entry = fetch(lemma)
        with pool.connection() as conn:
            cached = dictionary.upsert(conn, lemma, entry, word_rank(lemma))
    with pool.connection() as conn:
        filled = items.attach_dictionary(
            conn, user_id, item_id, cached["id"], cached["definition_en"]
        )
        if filled:
            cards.ensure(conn, user_id, item_id, ["define_to_word"])

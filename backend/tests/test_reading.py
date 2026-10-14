from uuid import uuid4

from app.services.reading import normalize_word, saved_surfaces


def test_normalize_word_keeps_one_word_lowercased() -> None:
    assert normalize_word("  Invalidating, ") == "invalidating"
    assert normalize_word("don\N{RIGHT SINGLE QUOTATION MARK}t") == "don't"
    assert normalize_word("trade-off") == "trade-off"


def test_normalize_word_rejects_phrases_numbers_and_junk() -> None:
    for raw in ("two words", "", "123", "a<b", "a" * 65):
        assert normalize_word(raw) is None


def test_saved_surfaces_match_every_inflection_of_a_saved_lemma() -> None:
    item = uuid4()
    text = "Invalidating a cache is hard. Teams invalidate caches; the cache was invalidated."
    found = saved_surfaces(text, {"invalidate": item})
    assert found == {"invalidating": item, "invalidate": item, "invalidated": item}


def test_saved_surfaces_ignore_unsaved_words() -> None:
    assert saved_surfaces("Nothing saved here.", {"cache": uuid4()}) == {}

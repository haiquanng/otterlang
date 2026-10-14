from app.services.dictionary import parse_entries
from app.services.items import card_types_for, normalize_term

SAMPLE = [
    {
        "word": "cache",
        "phonetics": [{"audio": ""}, {"text": "/kæʃ/"}],
        "meanings": [
            {"partOfSpeech": "noun", "definitions": [{"definition": "A store of things."}]},
            {"partOfSpeech": "verb", "definitions": [{"definition": "To store.", "example": "x"}]},
        ],
    }
]


def test_takes_first_definition_and_phonetic_text() -> None:
    entry = parse_entries(SAMPLE)
    assert entry is not None
    assert (entry.pos, entry.definition, entry.phonetic, entry.examples) == (
        "noun",
        "A store of things.",
        "/kæʃ/",
        [],
    )


def test_malformed_payloads_return_none() -> None:
    for payload in (None, {}, [], ["x"], [{"meanings": "nope"}], [{"meanings": [{"x": 1}]}]):
        assert parse_entries(payload) is None


def test_normalize_term() -> None:
    assert normalize_term("  Caches ") == ("Caches", "word", "cache")
    assert normalize_term("reduce   Latency") == ("reduce Latency", "collocation", "reduce latency")


def test_card_types_follow_available_data() -> None:
    assert card_types_for(None, None) == []
    assert card_types_for("A sentence.", None) == ["cloze"]
    assert card_types_for("A sentence.", "A meaning.") == ["cloze", "define_to_word"]

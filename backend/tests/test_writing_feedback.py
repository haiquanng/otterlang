from typing import Any

import pytest

from app.services.ai import AiUnavailableError, _answer_text
from app.services.writing_feedback import ask_feedback, build_prompt, sentence_hash

GOOD = {
    "word_used_correctly": True,
    "natural_version": "We have many servers.",
    "tip": "Use 'have'.",
}


def test_same_sentence_with_other_spacing_shares_a_cache_key() -> None:
    assert sentence_hash("We  invalidate it.\n") == sentence_hash("We invalidate it.")
    assert sentence_hash("We invalidate it.") != sentence_hash("We invalidated it.")


def test_prompt_fences_the_learner_sentence() -> None:
    prompt = build_prompt("resilient", "Recovers quickly.", "Our   system is resilient.")
    assert 'Target word: "resilient" (Recovers quickly.)' in prompt
    assert "<sentence>\nOur system is resilient.\n</sentence>" in prompt
    assert "()" not in build_prompt("resilient", None, "x")


def test_valid_answer_becomes_feedback() -> None:
    feedback = ask_feedback(lambda system, prompt, schema: GOOD, "resilient", None, "x")
    assert feedback.word_used_correctly is True
    assert feedback.tip == "Use 'have'."


@pytest.mark.parametrize(
    "answer",
    [{}, {**GOOD, "tip": ""}, {**GOOD, "word_used_correctly": "maybe"}],
)
def test_off_schema_answer_is_unavailable(answer: dict[str, Any]) -> None:
    with pytest.raises(AiUnavailableError):
        ask_feedback(lambda system, prompt, schema: answer, "resilient", None, "x")


def test_answer_text_skips_thought_parts() -> None:
    payload = {
        "candidates": [
            {"content": {"parts": [{"text": "thinking", "thought": True}, {"text": '{"a": 1}'}]}}
        ]
    }
    assert _answer_text(payload) == '{"a": 1}'

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.db import Pool
from app.main import app
from app.services.ai import AiUnavailableError, get_ask_json
from tests.integration.helpers import signup

SENTENCE = "Our system is resilient because we has many server."
ANSWER = {
    "word_used_correctly": True,
    "natural_version": "Our system is resilient because we have many servers.",
    "tip": "Use 'have' with 'we'.",
}


class FakeAi:
    def __init__(self) -> None:
        self.prompts: list[str] = []
        self.down = False

    def __call__(self, system: str, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        self.prompts.append(prompt)
        if self.down:
            raise AiUnavailableError("timeout")
        return ANSWER


@pytest.fixture
def ai(client: TestClient) -> Iterator[FakeAi]:
    fake = FakeAi()
    app.dependency_overrides[get_ask_json] = lambda: fake
    yield fake


def _writing_card(client: TestClient, pool: Pool, auth: dict[str, str]) -> str:
    item_id = client.post(
        "/items", json={"term": "resilient", "definition": "Recovers quickly."}, headers=auth
    ).json()["id"]
    with pool.connection() as conn:
        row = conn.execute(
            "select id from cards where item_id = %s and card_type = 'write_sentence'", (item_id,)
        ).fetchone()
    assert row
    return str(row["id"])


def _ask(client: TestClient, auth: dict[str, str], card_id: str, sentence: str = SENTENCE) -> Any:
    return client.post(
        "/ai/feedback", json={"card_id": card_id, "sentence": sentence}, headers=auth
    )


def test_feedback_is_cached_per_sentence(client: TestClient, pool: Pool, ai: FakeAi) -> None:
    auth = signup(client)
    card = _writing_card(client, pool, auth)
    assert _ask(client, auth, card).json() == ANSWER
    assert _ask(client, auth, card, f"  {SENTENCE} ").json() == ANSWER
    assert len(ai.prompts) == 1
    assert '"resilient" (Recovers quickly.)' in ai.prompts[0]


def test_ai_off_answers_404(client: TestClient, pool: Pool) -> None:
    auth = signup(client)
    card = _writing_card(client, pool, auth)
    assert _ask(client, auth, card).status_code == 404


def test_other_learners_card_is_not_found(client: TestClient, pool: Pool, ai: FakeAi) -> None:
    owner = signup(client)
    card = _writing_card(client, pool, owner)
    other = signup(client, "other@example.com")
    assert _ask(client, other, card).status_code == 404
    assert ai.prompts == []


def test_provider_failure_is_503_and_not_cached(client: TestClient, pool: Pool, ai: FakeAi) -> None:
    auth = signup(client)
    card = _writing_card(client, pool, auth)
    ai.down = True
    assert _ask(client, auth, card).status_code == 503
    ai.down = False
    assert _ask(client, auth, card).status_code == 200


def test_daily_limit_counts_new_sentences_only(
    client: TestClient, pool: Pool, ai: FakeAi, settings: Settings
) -> None:
    settings.ai_daily_limit = 1
    auth = signup(client)
    card = _writing_card(client, pool, auth)
    assert _ask(client, auth, card).status_code == 200
    assert _ask(client, auth, card).status_code == 200  # cached
    assert _ask(client, auth, card, "The resilient team shipped on time.").status_code == 429

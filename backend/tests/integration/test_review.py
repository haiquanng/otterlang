from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.db import Pool
from tests.integration.helpers import signup

SENTENCE = "Invalidating a cache is notoriously difficult."


def _save_word(client: TestClient, auth: dict[str, str], definition: str | None = None) -> str:
    body = {"term": "invalidate", "surface": "Invalidating", "sentence": SENTENCE}
    if definition:
        body["definition"] = definition
    item_id: str = client.post("/items", json=body, headers=auth).json()["id"]
    return item_id


def test_new_cards_are_due_with_prompts_that_hide_the_answer(client: TestClient) -> None:
    auth = signup(client)
    _save_word(client, auth, definition="Make something no longer valid.")
    cards = client.get("/review/due", headers=auth).json()
    by_type = {c["card_type"]: c for c in cards}
    assert by_type["cloze"]["prompt"] == "_____ a cache is notoriously difficult."
    assert by_type["define_to_word"]["prompt"] == "Make something no longer valid."
    assert by_type["define_to_word"]["hint"] == "i…"
    assert all(c["is_new"] for c in cards)
    assert all("invalidat" not in c["prompt"].lower() for c in cards)


def test_check_then_answer_moves_the_card_out_of_today(client: TestClient) -> None:
    auth = signup(client)
    _save_word(client, auth)
    card = client.get("/review/due", headers=auth).json()[0]

    checked = client.post(
        f"/review/{card['id']}/check",
        json={"answer": "invalidating", "response_ms": 3000},
        headers=auth,
    ).json()
    assert checked["correct"] is True
    assert checked["expected"] == "Invalidating"
    assert checked["sentence"] == SENTENCE
    assert checked["suggested_rating"] == 4

    answered = client.post(
        f"/review/{card['id']}/answer",
        json={"rating": 4, "correct": True, "response_ms": 3000},
        headers=auth,
    ).json()
    assert datetime.fromisoformat(answered["due"]) > datetime.now(UTC)
    assert client.get("/review/due", headers=auth).json() == []


def test_answer_writes_a_review_log(client: TestClient, pool: Pool) -> None:
    auth = signup(client)
    _save_word(client, auth)
    card = client.get("/review/due", headers=auth).json()[0]
    client.post(f"/review/{card['id']}/answer", json={"rating": 1, "correct": False}, headers=auth)
    with pool.connection() as conn:
        row = conn.execute("select rating, correct from review_logs").fetchone()
    assert row == {"rating": 1, "correct": False}


def test_archived_items_are_not_reviewed(client: TestClient) -> None:
    auth = signup(client)
    item_id = _save_word(client, auth)
    client.patch(f"/items/{item_id}", json={"status": "archived"}, headers=auth)
    assert client.get("/review/due", headers=auth).json() == []


def test_cards_are_private(client: TestClient) -> None:
    owner = signup(client, "owner@example.com")
    stranger = signup(client, "stranger@example.com")
    _save_word(client, owner)
    card_id = client.get("/review/due", headers=owner).json()[0]["id"]
    assert client.get("/review/due", headers=stranger).json() == []
    check = client.post(f"/review/{card_id}/check", json={"answer": "x"}, headers=stranger)
    assert check.status_code == 404
    answer = client.post(f"/review/{card_id}/answer", json={"rating": 3}, headers=stranger)
    assert answer.status_code == 404


def test_rating_must_be_one_to_four(client: TestClient) -> None:
    auth = signup(client)
    _save_word(client, auth)
    card_id = client.get("/review/due", headers=auth).json()[0]["id"]
    for rating in (0, 5):
        response = client.post(f"/review/{card_id}/answer", json={"rating": rating}, headers=auth)
        assert response.status_code == 422

from fastapi.testclient import TestClient

from app.db import Pool
from tests.integration.helpers import signup


def _make_writing_card_due(pool: Pool, item_id: str) -> None:
    with pool.connection() as conn:
        conn.execute(
            "update cards set due = now() - interval '1 minute' "
            "where item_id = %s and card_type = 'write_sentence'",
            (item_id,),
        )


def test_saving_a_word_schedules_a_writing_card_for_later(client: TestClient) -> None:
    auth = signup(client)
    client.post("/items", json={"term": "resilient", "definition": "Recovers."}, headers=auth)
    due_types = {c["card_type"] for c in client.get("/review/due", headers=auth).json()}
    assert due_types == {"define_to_word"}


def test_writing_card_feedback_and_saved_sentence(client: TestClient, pool: Pool) -> None:
    auth = signup(client)
    item_id = client.post(
        "/items", json={"term": "invalidate", "definition": "Make invalid."}, headers=auth
    ).json()["id"]
    _make_writing_card_due(pool, item_id)
    card = next(
        c
        for c in client.get("/review/due", headers=auth).json()
        if c["card_type"] == "write_sentence"
    )
    assert (card["prompt"], card["hint"]) == ("invalidate", "Make invalid.")

    weak = client.post(
        f"/review/{card['id']}/check", json={"answer": "we clear it"}, headers=auth
    ).json()
    assert weak["correct"] is False
    assert "missing_word" in weak["issues"]

    sentence = "We invalidate the cache after every deploy."
    good = client.post(
        f"/review/{card['id']}/check", json={"answer": sentence}, headers=auth
    ).json()
    assert good["correct"] is True
    assert good["issues"] == []
    assert good["sentence"] == sentence

    client.post(
        f"/review/{card['id']}/answer",
        json={"rating": 3, "correct": True, "sentence": sentence},
        headers=auth,
    )
    contexts = client.get(f"/items/{item_id}", headers=auth).json()["contexts"]
    assert contexts == [
        {
            "sentence": sentence,
            "surface": None,
            "source_id": None,
            "source_title": None,
            "written_by_learner": True,
        }
    ]


def test_sentence_without_the_word_is_not_kept(client: TestClient, pool: Pool) -> None:
    auth = signup(client)
    item_id = client.post("/items", json={"term": "invalidate"}, headers=auth).json()["id"]
    _make_writing_card_due(pool, item_id)
    card = client.get("/review/due", headers=auth).json()[0]
    client.post(
        f"/review/{card['id']}/answer",
        json={"rating": 1, "sentence": "We clear the cache daily."},
        headers=auth,
    )
    assert client.get(f"/items/{item_id}", headers=auth).json()["contexts"] == []

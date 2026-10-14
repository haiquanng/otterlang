from fastapi.testclient import TestClient

from tests.integration.helpers import signup


def test_empty_account(client: TestClient) -> None:
    auth = signup(client)
    data = client.get("/today?tz=Asia/Ho_Chi_Minh", headers=auth).json()
    assert {k: data[k] for k in ("due_now", "total_words", "mastered_words", "reviewed_today")} == {
        "due_now": 0,
        "total_words": 0,
        "mastered_words": 0,
        "reviewed_today": 0,
    }
    assert data["daily_goal"] == 20
    assert len(data["week"]) == 7
    assert all(day["reviews"] == 0 for day in data["week"])
    assert data["recent_documents"] == []


def test_reviews_count_toward_today_and_goal_is_editable(client: TestClient) -> None:
    auth = signup(client)
    client.post("/items", json={"term": "resilient", "definition": "Recovers."}, headers=auth)
    for card in client.get("/review/due", headers=auth).json():
        client.post(f"/review/{card['id']}/answer", json={"rating": 3}, headers=auth)
    client.patch("/me", json={"daily_goal": 30}, headers=auth)

    data = client.get("/today?tz=Asia/Ho_Chi_Minh", headers=auth).json()
    assert data["reviewed_today"] == 1
    assert data["week"][-1]["reviews"] == 1
    assert data["daily_goal"] == 30
    assert client.patch("/me", json={"daily_goal": 0}, headers=auth).status_code == 422


def test_counts_due_cards_new_words_and_recent_documents(client: TestClient) -> None:
    auth = signup(client)
    for i in range(4):
        client.post("/sources", json={"title": f"Doc {i}", "body": "Some text."}, headers=auth)
    sentence = "Invalidating a cache is difficult."
    body = {"term": "invalidate", "surface": "Invalidating", "sentence": sentence}
    client.post("/items", json=body, headers=auth)
    client.post(
        "/items", json={"term": "resilient", "definition": "Recovers quickly."}, headers=auth
    )

    data = client.get("/today", headers=auth).json()
    assert data["due_now"] == 2
    assert data["new_this_week"] == 2
    assert data["total_words"] == 2
    assert [d["title"] for d in data["recent_documents"]] == ["Doc 3", "Doc 2", "Doc 1"]


def test_answered_card_leaves_due_now(client: TestClient) -> None:
    auth = signup(client)
    client.post(
        "/items", json={"term": "resilient", "definition": "Recovers quickly."}, headers=auth
    )
    card = client.get("/review/due", headers=auth).json()[0]
    client.post(f"/review/{card['id']}/answer", json={"rating": 1}, headers=auth)
    data = client.get("/today", headers=auth).json()
    assert data["due_now"] == 0
    assert data["due_later_today"] == 1


def test_bad_timezone_is_422(client: TestClient) -> None:
    auth = signup(client)
    assert client.get("/today?tz=Nowhere/Land", headers=auth).status_code == 422

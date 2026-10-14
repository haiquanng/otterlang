from fastapi.testclient import TestClient

from tests.integration.helpers import signup

DOC = {
    "title": "Caching",
    "kind": "tech_blog",
    "body": "Invalidating a cache is notoriously difficult. The idempotent endpoint is safe.",
}


def _create(client: TestClient, auth: dict[str, str]) -> str:
    source_id: str = client.post("/sources", json=DOC, headers=auth).json()["id"]
    return source_id


def _lemmas(client: TestClient, auth: dict[str, str], source_id: str) -> list[str]:
    response = client.get(f"/sources/{source_id}/candidates", headers=auth)
    assert response.status_code == 200, response.text
    return [c["lemma"] for c in response.json()]


def test_candidates_come_with_their_sentence(client: TestClient) -> None:
    auth = signup(client)
    source_id = _create(client, auth)
    response = client.get(f"/sources/{source_id}/candidates", headers=auth).json()
    idempotent = next(c for c in response if c["lemma"] == "idempotent")
    assert idempotent["sentence"] == "The idempotent endpoint is safe."


def test_known_words_disappear_and_can_be_restored(client: TestClient) -> None:
    auth = signup(client)
    source_id = _create(client, auth)
    assert "notoriously" in _lemmas(client, auth, source_id)

    added = client.post("/known-words", json={"lemma": " Notoriously "}, headers=auth)
    assert added.json() == {"added": 1}
    assert "notoriously" not in _lemmas(client, auth, source_id)

    assert client.delete("/known-words/notoriously", headers=auth).status_code == 204
    assert "notoriously" in _lemmas(client, auth, source_id)


def test_bulk_known_ignores_duplicates(client: TestClient) -> None:
    auth = signup(client)
    body = {"lemmas": ["idempotent", "invalidate", "idempotent"]}
    assert client.post("/known-words/bulk", json=body, headers=auth).json() == {"added": 2}
    assert client.post("/known-words/bulk", json=body, headers=auth).json() == {"added": 0}


def test_known_words_are_per_user(client: TestClient) -> None:
    me = signup(client, "me@example.com")
    friend = signup(client, "friend@example.com")
    client.post("/known-words", json={"lemma": "idempotent"}, headers=me)
    friend_source = _create(client, friend)
    assert "idempotent" in _lemmas(client, friend, friend_source)


def test_skip_threshold_comes_from_the_profile(client: TestClient) -> None:
    auth = signup(client)
    source_id = _create(client, auth)
    before = _lemmas(client, auth, source_id)
    client.patch("/me", json={"skip_top_n": 40_000}, headers=auth)
    assert len(_lemmas(client, auth, source_id)) < len(before)


def test_invalid_lemma_is_rejected(client: TestClient) -> None:
    auth = signup(client)
    for bad in ("", "two words", "<script>", "a" * 65):
        assert client.post("/known-words", json={"lemma": bad}, headers=auth).status_code == 422


def test_other_users_source_is_not_found(client: TestClient) -> None:
    owner = signup(client, "owner@example.com")
    stranger = signup(client, "stranger@example.com")
    source_id = _create(client, owner)
    assert client.get(f"/sources/{source_id}/candidates", headers=stranger).status_code == 404

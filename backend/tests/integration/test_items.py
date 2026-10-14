from typing import Any

from fastapi.testclient import TestClient

from app.services.dictionary import DictionaryEntry
from tests.integration.conftest import FakeDictionary
from tests.integration.helpers import signup

SENTENCE = "Invalidating a cache is notoriously difficult."
DOC = {"title": "Caching", "kind": "tech_blog", "body": SENTENCE}


def _source(client: TestClient, auth: dict[str, str]) -> str:
    source_id: str = client.post("/sources", json=DOC, headers=auth).json()["id"]
    return source_id


def _save(
    client: TestClient, auth: dict[str, str], source_id: str, sentence: str = SENTENCE
) -> Any:
    return client.post(
        "/items",
        json={
            "term": "invalidate",
            "surface": "Invalidating",
            "sentence": sentence,
            "source_id": source_id,
            "tags": ["technical"],
        },
        headers=auth,
    )


def test_save_from_document_stores_context_and_tags(client: TestClient) -> None:
    auth = signup(client)
    created = _save(client, auth, _source(client, auth))
    assert created.status_code == 201
    item = created.json()
    assert item["lemma"] == "invalidate"
    assert item["tags"] == ["technical"]
    assert item["contexts"][0]["surface"] == "Invalidating"
    assert item["contexts"][0]["source_title"] == "Caching"


def test_saving_again_adds_a_context_instead_of_a_second_item(client: TestClient) -> None:
    auth = signup(client)
    source_id = _source(client, auth)
    first = _save(client, auth, source_id).json()
    again = _save(client, auth, source_id, "Teams invalidate caches often.")
    assert again.status_code == 200
    assert again.json()["id"] == first["id"]
    assert len(again.json()["contexts"]) == 2
    same_sentence = _save(client, auth, source_id)
    assert len(same_sentence.json()["contexts"]) == 2
    assert len(client.get("/items", headers=auth).json()) == 1


def test_saved_word_disappears_from_candidates(client: TestClient) -> None:
    auth = signup(client)
    source_id = _source(client, auth)
    _save(client, auth, source_id)
    lemmas = [
        c["lemma"] for c in client.get(f"/sources/{source_id}/candidates", headers=auth).json()
    ]
    assert "invalidate" not in lemmas


def test_definition_is_filled_from_the_dictionary_after_saving(
    client: TestClient, dictionary: FakeDictionary
) -> None:
    dictionary.entries["idempotent"] = DictionaryEntry(pos="adjective", definition="Same result.")
    auth = signup(client)
    item = client.post("/items", json={"term": "Idempotent"}, headers=auth).json()
    detail = client.get(f"/items/{item['id']}", headers=auth).json()
    assert detail["definition"] == "Same result."

    # Second user: served from the shared cache, no second network call.
    other = signup(client, "other@example.com")
    client.post("/items", json={"term": "idempotent"}, headers=other)
    assert dictionary.calls == ["idempotent"]


def test_dictionary_miss_still_saves_the_item(
    client: TestClient, dictionary: FakeDictionary
) -> None:
    auth = signup(client)
    response = client.post("/items", json={"term": "flibbertigibbet"}, headers=auth)
    assert response.status_code == 201
    assert client.get(f"/items/{response.json()['id']}", headers=auth).json()["definition"] is None


def test_user_definition_is_never_overwritten(
    client: TestClient, dictionary: FakeDictionary
) -> None:
    dictionary.entries["cache"] = DictionaryEntry(pos="noun", definition="Dictionary text.")
    auth = signup(client)
    body = {"term": "cache", "definition": "My own words."}
    item = client.post("/items", json=body, headers=auth).json()
    assert client.get(f"/items/{item['id']}", headers=auth).json()["definition"] == "My own words."
    assert dictionary.calls == []


def test_quick_add_phrase_is_a_collocation(client: TestClient) -> None:
    auth = signup(client)
    item = client.post("/items", json={"term": "  reduce   latency "}, headers=auth).json()
    assert item["type"] == "collocation"
    assert item["term"] == "reduce latency"


def test_search_filter_update_and_delete(client: TestClient) -> None:
    auth = signup(client)
    source_id = _source(client, auth)
    item_id = _save(client, auth, source_id).json()["id"]
    client.post("/items", json={"term": "resilient", "tags": ["ielts"]}, headers=auth)

    assert [i["term"] for i in client.get("/items?q=inval", headers=auth).json()] == ["invalidate"]
    assert [i["term"] for i in client.get("/items?tag=ielts", headers=auth).json()] == ["resilient"]
    by_source = client.get(f"/items?source_id={source_id}", headers=auth).json()
    assert [i["id"] for i in by_source] == [item_id]
    assert client.get("/items?q=100%25", headers=auth).json() == []

    patched = client.patch(
        f"/items/{item_id}", json={"note": "cache context", "tags": ["general"]}, headers=auth
    ).json()
    assert patched["note"] == "cache context"
    assert patched["tags"] == ["general"]

    client.patch(f"/items/{item_id}", json={"status": "archived"}, headers=auth)
    assert [i["term"] for i in client.get("/items", headers=auth).json()] == ["resilient"]

    assert client.delete(f"/items/{item_id}", headers=auth).status_code == 204
    assert client.get(f"/items/{item_id}", headers=auth).status_code == 404


def test_items_are_private(client: TestClient) -> None:
    owner = signup(client, "owner@example.com")
    stranger = signup(client, "stranger@example.com")
    item_id = client.post("/items", json={"term": "resilient"}, headers=owner).json()["id"]
    assert client.get("/items", headers=stranger).json() == []
    assert client.get(f"/items/{item_id}", headers=stranger).status_code == 404
    assert (
        client.patch(f"/items/{item_id}", json={"note": "x"}, headers=stranger).status_code == 404
    )
    assert client.delete(f"/items/{item_id}", headers=stranger).status_code == 404


def test_cannot_attach_to_another_users_document(client: TestClient) -> None:
    owner = signup(client, "owner@example.com")
    stranger = signup(client, "stranger@example.com")
    response = _save(client, stranger, _source(client, owner))
    assert response.status_code == 404

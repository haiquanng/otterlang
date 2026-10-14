from fastapi.testclient import TestClient

from app.services.dictionary import DictionaryEntry
from tests.integration.conftest import FakeDictionary
from tests.integration.helpers import signup

BODY = "Invalidating a cache is notoriously difficult. Teams invalidate caches often."


def test_lookup_returns_meaning_and_status(client: TestClient, dictionary: FakeDictionary) -> None:
    dictionary.entries["invalidate"] = DictionaryEntry(
        pos="verb", definition="Make invalid.", phonetic="/in-VAL-i-date/"
    )
    auth = signup(client)
    first = client.get("/lookup?word=Invalidating", headers=auth).json()
    assert first["lemma"] == "invalidate"
    assert first["definition"] == "Make invalid."
    assert first["phonetic"] == "/in-VAL-i-date/"
    assert first["status"] == "new"

    client.post("/items", json={"term": "invalidate"}, headers=auth)
    assert client.get("/lookup?word=invalidated", headers=auth).json()["status"] == "saved"
    client.post("/known-words", json={"lemma": "notoriously"}, headers=auth)
    assert client.get("/lookup?word=notoriously", headers=auth).json()["status"] == "known"
    # The definition came from the shared cache the second time.
    assert dictionary.calls.count("invalidate") == 1


def test_lookup_survives_a_dictionary_outage(
    client: TestClient, dictionary: FakeDictionary
) -> None:
    dictionary.down = True
    auth = signup(client)
    response = client.get("/lookup?word=cache", headers=auth)
    assert response.status_code == 200
    assert response.json()["definition"] is None


def test_lookup_rejects_phrases(client: TestClient) -> None:
    auth = signup(client)
    assert client.get("/lookup?word=two%20words", headers=auth).status_code == 422


def test_annotations_highlight_saved_words_in_a_document(client: TestClient) -> None:
    auth = signup(client)
    source_id = client.post(
        "/sources", json={"title": "Caching", "body": BODY}, headers=auth
    ).json()["id"]
    item_id = client.post("/items", json={"term": "invalidate"}, headers=auth).json()["id"]

    saved = client.get(f"/sources/{source_id}/annotations", headers=auth).json()["saved"]
    assert saved == {"invalidating": item_id, "invalidate": item_id}

    other = signup(client, "other@example.com")
    assert client.get(f"/sources/{source_id}/annotations", headers=other).status_code == 404

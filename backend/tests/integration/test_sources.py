from fastapi.testclient import TestClient

from app.routers.sources import MAX_BODY_CHARS
from tests.integration.helpers import signup

DOC = {
    "title": "Caching at the edge",
    "kind": "tech_blog",
    "url": "https://example.com/caching",
    "body": "Invalidating a cache is one of the hardest problems in computing.",
}


def test_create_list_get_update_delete(client: TestClient) -> None:
    auth = signup(client)
    created = client.post("/sources", json=DOC, headers=auth)
    assert created.status_code == 201
    source_id = created.json()["id"]

    listed = client.get("/sources", headers=auth).json()
    assert [s["id"] for s in listed] == [source_id]
    assert listed[0]["char_count"] == len(DOC["body"])
    assert "body" not in listed[0]

    assert client.get(f"/sources/{source_id}", headers=auth).json()["body"] == DOC["body"]

    updated = client.put(f"/sources/{source_id}", json={**DOC, "title": "New"}, headers=auth)
    assert updated.json()["title"] == "New"

    assert client.delete(f"/sources/{source_id}", headers=auth).status_code == 204
    assert client.get(f"/sources/{source_id}", headers=auth).status_code == 404


def test_other_users_cannot_see_or_change_a_source(client: TestClient) -> None:
    owner = signup(client, "owner@example.com")
    stranger = signup(client, "stranger@example.com")
    source_id = client.post("/sources", json=DOC, headers=owner).json()["id"]

    assert client.get("/sources", headers=stranger).json() == []
    assert client.get(f"/sources/{source_id}", headers=stranger).status_code == 404
    assert client.put(f"/sources/{source_id}", json=DOC, headers=stranger).status_code == 404
    assert client.delete(f"/sources/{source_id}", headers=stranger).status_code == 404
    assert client.get(f"/sources/{source_id}", headers=owner).status_code == 200


def test_rejects_oversize_blank_and_non_http_input(client: TestClient) -> None:
    auth = signup(client)
    too_long = {**DOC, "body": "a" * (MAX_BODY_CHARS + 1)}
    assert client.post("/sources", json=too_long, headers=auth).status_code == 422
    assert client.post("/sources", json={**DOC, "body": "   "}, headers=auth).status_code == 422
    bad_url = {**DOC, "url": "javascript:alert(1)"}
    assert client.post("/sources", json=bad_url, headers=auth).status_code == 422


def test_blank_url_is_stored_as_null(client: TestClient) -> None:
    auth = signup(client)
    created = client.post("/sources", json={**DOC, "url": ""}, headers=auth)
    assert created.json()["url"] is None


def test_requires_auth(client: TestClient) -> None:
    assert client.get("/sources").status_code == 401

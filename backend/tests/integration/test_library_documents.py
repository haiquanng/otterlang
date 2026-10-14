from fastapi.testclient import TestClient

from app.db import Pool
from app.repositories import library_documents
from tests.integration.helpers import signup


def _seed(pool: Pool) -> None:
    with pool.connection() as conn:
        conn.execute("truncate library_documents cascade")
        for title, kind in (("Coral reef", "ielts"), ("Idempotence", "tech_blog")):
            library_documents.upsert(
                conn,
                title=title,
                kind=kind,
                url=f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                body=f"{title} is a topic worth reading about.",
                source_name="Wikipedia",
                license_name="CC BY-SA 4.0",
            )


def test_list_and_filter_by_kind(client: TestClient, pool: Pool) -> None:
    _seed(pool)
    auth = signup(client)
    everything = client.get("/library-documents", headers=auth).json()
    assert [d["title"] for d in everything] == ["Idempotence", "Coral reef"]
    assert all(d["source_id"] is None for d in everything)
    ielts = client.get("/library-documents?kind=ielts", headers=auth).json()
    assert [d["title"] for d in ielts] == ["Coral reef"]


def test_add_copies_into_my_documents_once(client: TestClient, pool: Pool) -> None:
    _seed(pool)
    auth = signup(client)
    doc = client.get("/library-documents", headers=auth).json()[0]

    first = client.post(f"/library-documents/{doc['id']}/add", headers=auth)
    assert first.status_code == 201
    again = client.post(f"/library-documents/{doc['id']}/add", headers=auth)
    assert again.status_code == 200
    assert again.json() == first.json()

    source = client.get(f"/sources/{first.json()['source_id']}", headers=auth).json()
    assert source["title"] == "Idempotence"
    assert source["kind"] == "tech_blog"
    assert len(client.get("/sources", headers=auth).json()) == 1
    listed = client.get("/library-documents", headers=auth).json()[0]
    assert listed["source_id"] == first.json()["source_id"]


def test_copies_are_per_user_and_independent(client: TestClient, pool: Pool) -> None:
    _seed(pool)
    me = signup(client, "me@example.com")
    friend = signup(client, "friend@example.com")
    doc_id = client.get("/library-documents", headers=me).json()[0]["id"]
    mine = client.post(f"/library-documents/{doc_id}/add", headers=me).json()["source_id"]

    assert client.get("/library-documents", headers=friend).json()[0]["source_id"] is None
    theirs = client.post(f"/library-documents/{doc_id}/add", headers=friend).json()["source_id"]
    assert theirs != mine

    client.delete(f"/sources/{mine}", headers=me)
    assert client.get(f"/sources/{theirs}", headers=friend).status_code == 200
    assert client.get("/library-documents", headers=me).json()[0]["source_id"] is None


def test_upsert_refreshes_by_url(pool: Pool) -> None:
    _seed(pool)
    with pool.connection() as conn:
        new = library_documents.upsert(
            conn,
            title="Idempotence",
            kind="tech_blog",
            url="https://en.wikipedia.org/wiki/Idempotence",
            body="Updated text with more words.",
            source_name="Wikipedia",
            license_name="CC BY-SA 4.0",
        )
        count = conn.execute("select count(*) as n from library_documents").fetchone()
    assert new is False
    assert count == {"n": 2}


def test_unknown_library_text_is_404(client: TestClient) -> None:
    auth = signup(client)
    missing = "00000000-0000-4000-8000-000000000000"
    assert client.post(f"/library-documents/{missing}/add", headers=auth).status_code == 404

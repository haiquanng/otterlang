from fastapi.testclient import TestClient

from app.db import Pool
from tests.integration.helpers import signup


def _item_with_contexts(
    client: TestClient,
    pool: Pool,
    auth: dict[str, str],
    term: str,
    contexts: list[tuple[str, bool]],
) -> str:
    item_id: str = client.post("/items", json={"term": term}, headers=auth).json()["id"]
    with pool.connection() as conn:
        for sentence, mine in contexts:
            conn.execute(
                "insert into item_contexts (user_id, item_id, sentence, written_by_learner) "
                "select user_id, id, %s, %s from items where id = %s",
                (sentence, mine, item_id),
            )
    return item_id


def test_own_sentences_come_first_and_long_ones_are_left_out(
    client: TestClient, pool: Pool
) -> None:
    auth = signup(client)
    _item_with_contexts(
        client,
        pool,
        auth,
        "resilient",
        [
            ("Resilient systems recover from failure.", False),
            ("Our team stayed resilient after the outage.", True),
            ("word " * 60, False),
        ],
    )
    rows = client.get("/speaking/sentences", headers=auth).json()
    assert [(r["sentence"], r["mine"], r["term"]) for r in rows] == [
        ("Our team stayed resilient after the outage.", True, "resilient"),
        ("Resilient systems recover from failure.", False, "resilient"),
    ]


def test_only_own_active_items(client: TestClient, pool: Pool) -> None:
    owner = signup(client)
    item_id = _item_with_contexts(client, pool, owner, "mitigate", [("We mitigate risk.", True)])
    other = signup(client, "other@example.com")
    assert client.get("/speaking/sentences", headers=other).json() == []

    client.delete(f"/items/{item_id}", headers=owner)
    assert client.get("/speaking/sentences", headers=owner).json() == []
    assert client.get("/speaking/sentences").status_code == 401

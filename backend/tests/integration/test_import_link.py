from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routers.import_link import import_limiter
from app.services.web_fetch import (
    Article,
    NoReadableTextError,
    NotPublicUrlError,
    PageUnavailableError,
    get_article_fetch,
)
from tests.integration.helpers import signup

URL = "https://blog.example/why-caches-lie"


class FakeFetch:
    def __init__(self) -> None:
        self.error: Exception | None = None
        self.calls: list[str] = []

    def __call__(self, url: str, max_chars: int) -> Article:
        self.calls.append(url)
        if self.error:
            raise self.error
        return Article(title="Why caches lie", text="Invalidating a cache is hard.")


@pytest.fixture
def fake_fetch(client: TestClient) -> Iterator[FakeFetch]:
    fake = FakeFetch()
    import_limiter.clear()
    app.dependency_overrides[get_article_fetch] = lambda: fake
    yield fake


def test_import_creates_a_document_with_the_page_title(
    client: TestClient, fake_fetch: FakeFetch
) -> None:
    auth = signup(client)
    response = client.post("/sources/import", json={"url": f"  {URL} "}, headers=auth)
    assert response.status_code == 201
    doc = response.json()
    assert (doc["title"], doc["url"], doc["kind"]) == ("Why caches lie", URL, "tech_blog")
    assert doc["body"] == "Invalidating a cache is hard."
    assert fake_fetch.calls == [URL]


@pytest.mark.parametrize(
    ("error", "status_code"),
    [
        (NotPublicUrlError(URL), 422),
        (PageUnavailableError(URL), 502),
        (NoReadableTextError(URL), 422),
    ],
)
def test_import_errors_are_explained(
    client: TestClient, fake_fetch: FakeFetch, error: Exception, status_code: int
) -> None:
    fake_fetch.error = error
    auth = signup(client)
    response = client.post("/sources/import", json={"url": URL}, headers=auth)
    assert response.status_code == status_code
    assert client.get("/sources", headers=auth).json() == []


def test_import_is_rate_limited_per_user(client: TestClient, fake_fetch: FakeFetch) -> None:
    auth = signup(client)
    codes = [
        client.post("/sources/import", json={"url": URL}, headers=auth).status_code
        for _ in range(21)
    ]
    assert codes[:20] == [201] * 20
    assert codes[20] == 429

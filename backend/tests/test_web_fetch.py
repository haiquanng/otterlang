import io
from http.client import HTTPMessage
from typing import Any

import pytest

from app.services import web_fetch
from app.services.web_fetch import (
    NoReadableTextError,
    NotPublicUrlError,
    extract_article,
    fetch_bytes,
)

PUBLIC = "93.184.216.34"


def _resolver(mapping: dict[str, str]) -> Any:
    def resolve(host: str) -> list[str]:
        return [mapping.get(host, PUBLIC)]

    return resolve


def test_redirect_into_the_private_network_is_refused(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(web_fetch, "_resolve", _resolver({"internal.example": "10.0.0.7"}))
    handler = web_fetch._PublicRedirectsOnly()
    request = web_fetch.urllib.request.Request("https://blog.example/post")
    with pytest.raises(NotPublicUrlError):
        handler.redirect_request(
            request, io.BytesIO(), 302, "Found", HTTPMessage(), "http://internal.example/admin"
        )


def test_redirect_to_another_public_page_is_followed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(web_fetch, "_resolve", _resolver({}))
    handler = web_fetch._PublicRedirectsOnly()
    request = web_fetch.urllib.request.Request("https://blog.example/post")
    follow = handler.redirect_request(
        request, io.BytesIO(), 301, "Moved", HTTPMessage(), "https://blog.example/new"
    )
    assert follow is not None and follow.full_url == "https://blog.example/new"


def test_private_or_non_http_links_are_refused_before_any_request(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(web_fetch, "_resolve", _resolver({"localhost": "127.0.0.1"}))
    for url in ("http://localhost:8000/health", "file:///etc/passwd", "ftp://blog.example/"):
        with pytest.raises(NotPublicUrlError):
            fetch_bytes(url)


def test_extract_article_takes_title_and_main_text() -> None:
    html = """<html><head><title>Why caches lie</title></head><body>
      <nav>Home | About</nav>
      <article><h1>Why caches lie</h1>
        <p>Invalidating a cache is notoriously difficult for every team that ships software.</p>
        <p>Stale data is the usual symptom, and it shows up at the worst possible moment.</p>
      </article></body></html>"""
    article = extract_article(html, fallback_title="https://blog.example", max_chars=10_000)
    assert article.title == "Why caches lie"
    assert "notoriously difficult" in article.text
    assert "Home | About" not in article.text


def test_extract_article_without_text_raises() -> None:
    with pytest.raises(NoReadableTextError):
        extract_article("<html><body></body></html>", fallback_title="x", max_chars=100)

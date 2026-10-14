"""Fetching user-supplied web pages safely, and extracting the readable article text.

Used by the "import from a link" endpoint and the owner's seed script. SSRF rules
(.claude/rules/security.md): http/https only, every resolved address must be public,
including after each redirect, 5 s timeout, 1 MB cap.
"""

import ipaddress
import socket
import ssl
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass
from http.client import HTTPMessage
from typing import IO

import certifi

USER_AGENT = "OtterLang/1.0 (+https://github.com/haiquanng/otterlang)"
TIMEOUT_SECONDS = 5
MAX_BYTES = 1_000_000

_TLS = ssl.create_default_context(cafile=certifi.where())

Resolver = Callable[[str], list[str]]


class NotPublicUrlError(ValueError):
    """The link is not http(s), or points at a private, loopback or reserved address."""


class PageUnavailableError(Exception):
    """The page could not be fetched (network, TLS, timeout, HTTP error, too large)."""


class NoReadableTextError(LookupError):
    """The page was fetched but has no article text to extract."""


@dataclass(frozen=True)
class Article:
    title: str
    text: str


def _resolve(host: str) -> list[str]:
    return [str(info[4][0]) for info in socket.getaddrinfo(host, None)]


def is_public_http_url(url: str, resolve: Resolver | None = None) -> bool:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    try:
        addresses = (resolve or _resolve)(parsed.hostname)
    except OSError:
        return False
    return bool(addresses) and all(ipaddress.ip_address(a).is_global for a in addresses)


def trim_to_paragraphs(text: str, max_chars: int) -> str:
    """Whole paragraphs up to max_chars, so a text never stops mid-sentence."""
    kept: list[str] = []
    total = 0
    for paragraph in (p.strip() for p in text.split("\n")):
        if not paragraph:
            continue
        if kept and total + len(paragraph) > max_chars:
            break
        kept.append(paragraph)
        total += len(paragraph) + 2
    return "\n\n".join(kept)


class _PublicRedirectsOnly(urllib.request.HTTPRedirectHandler):
    """A public page must not be able to redirect us into the private network."""

    def redirect_request(
        self,
        req: urllib.request.Request,
        fp: IO[bytes],
        code: int,
        msg: str,
        headers: HTTPMessage,
        newurl: str,
    ) -> urllib.request.Request | None:
        if not is_public_http_url(newurl):
            raise NotPublicUrlError(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


_opener = urllib.request.build_opener(
    _PublicRedirectsOnly, urllib.request.HTTPSHandler(context=_TLS)
)


def fetch_bytes(url: str) -> bytes:
    if not is_public_http_url(url):
        raise NotPublicUrlError(url)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})  # noqa: S310
    try:
        with _opener.open(request, timeout=TIMEOUT_SECONDS) as response:
            body: bytes = response.read(MAX_BYTES + 1)
    except NotPublicUrlError:
        raise
    except (OSError, ValueError) as exc:
        # HTTPError, URLError (DNS, TLS) and timeouts are OSError; bad URLs are ValueError.
        raise PageUnavailableError(url) from exc
    if len(body) > MAX_BYTES:
        raise PageUnavailableError(f"{url} is larger than {MAX_BYTES} bytes")
    return body


def extract_article(html: str, fallback_title: str, max_chars: int) -> Article:
    import trafilatura

    text = trafilatura.extract(html, include_comments=False, include_tables=False)
    if not text or not text.strip():
        raise NoReadableTextError(fallback_title)
    metadata = trafilatura.extract_metadata(html)
    title = (metadata.title if metadata and metadata.title else fallback_title).strip()
    return Article(title=title, text=trim_to_paragraphs(text, max_chars))


def fetch_article(url: str, max_chars: int) -> Article:
    html = fetch_bytes(url).decode("utf-8", errors="replace")
    return extract_article(html, fallback_title=url, max_chars=max_chars)


ArticleFetch = Callable[[str, int], Article]


def get_article_fetch() -> ArticleFetch:
    """Dependency so tests can swap in a fake and never hit the network."""
    return fetch_article

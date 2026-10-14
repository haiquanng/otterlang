"""Fetching and cleaning starter-library texts. Owner-only tooling, never on a request path."""

import ipaddress
import json
import re
import socket
import ssl
import urllib.parse
import urllib.request
from collections.abc import Callable
from typing import Any

import certifi

USER_AGENT = "OtterLang/1.0 (+https://github.com/haiquanng/otterlang)"
TIMEOUT_SECONDS = 5
MAX_BYTES = 1_000_000
# About a 6-8 minute read: long enough to be worth it, short enough for one sitting.
MAX_CHARS = 6000
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"

_TLS = ssl.create_default_context(cafile=certifi.where())
# Sections after which a Wikipedia article stops being prose.
_END_SECTIONS = re.compile(
    r"See also|References|External links|Further reading|Notes|Bibliography|Sources"
)
_HEADING = re.compile(r"=+\s*(.*?)\s*=+")

Resolver = Callable[[str], list[str]]


def _resolve(host: str) -> list[str]:
    return [str(info[4][0]) for info in socket.getaddrinfo(host, None)]


def is_public_http_url(url: str, resolve: Resolver = _resolve) -> bool:
    """SSRF guard: http(s) only, and every address the host resolves to must be public."""
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return False
    try:
        addresses = resolve(parsed.hostname)
    except OSError:
        return False
    return bool(addresses) and all(ipaddress.ip_address(a).is_global for a in addresses)


def trim_to_paragraphs(text: str, max_chars: int = MAX_CHARS) -> str:
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


def clean_wikipedia_extract(extract: str, max_chars: int = MAX_CHARS) -> str:
    """Keep prose only: drop "== Heading ==" lines and stop at See also / References."""
    kept: list[str] = []
    for line in extract.split("\n"):
        heading = _HEADING.fullmatch(line.strip())
        if heading:
            if _END_SECTIONS.fullmatch(heading.group(1)):
                break
            continue
        kept.append(line)
    return trim_to_paragraphs("\n".join(kept), max_chars)


def _get(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})  # noqa: S310
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS, context=_TLS) as response:  # noqa: S310
        body: bytes = response.read(MAX_BYTES + 1)
    if len(body) > MAX_BYTES:
        raise ValueError(f"{url} is larger than {MAX_BYTES} bytes")
    return body


def fetch_wikipedia(title: str) -> tuple[str, str, str]:
    """Return (canonical title, article URL, cleaned text)."""
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "prop": "extracts|info",
            "inprop": "url",
            "explaintext": 1,
            "redirects": 1,
            "format": "json",
            "formatversion": 2,
            "titles": title,
        }
    )
    payload: Any = json.loads(_get(f"{WIKIPEDIA_API}?{query}"))
    page = payload["query"]["pages"][0]
    if page.get("missing") or not page.get("extract"):
        raise LookupError(f"Wikipedia has no article '{title}'")
    return str(page["title"]), str(page["fullurl"]), clean_wikipedia_extract(str(page["extract"]))


def fetch_url(url: str) -> tuple[str, str]:
    """Return (title, main text) of any public page, extracted with trafilatura."""
    import trafilatura  # owner-only dependency (requirements-dev.txt)

    if not is_public_http_url(url):
        raise ValueError(f"refusing to fetch non-public or non-http URL: {url}")
    html = _get(url).decode("utf-8", errors="replace")
    text = trafilatura.extract(html, include_comments=False, include_tables=False)
    metadata = trafilatura.extract_metadata(html)
    if not text:
        raise LookupError(f"no readable text at {url}")
    title = (metadata.title if metadata and metadata.title else url).strip()
    return title, trim_to_paragraphs(text)

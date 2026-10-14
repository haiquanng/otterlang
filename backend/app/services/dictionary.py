"""Definition lookup: Wiktionary first, dictionaryapi.dev as a fallback.

Only ever called with fixed https hosts and a lemma path segment, never a user URL,
so the SSRF rules for crawling do not apply here.

`None` means every source answered "no such word" and is safe to cache. If no source
found the word and at least one was unreachable, DictionaryUnavailableError is raised so
callers retry later instead of caching a false miss.
"""

import json
import ssl
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from typing import Any

import certifi

from app.services.dictionary_parsers import DictionaryEntry, parse_entries, parse_wiktionary

WIKTIONARY_URL = "https://en.wiktionary.org/api/rest_v1/page/definition/"
FREE_DICTIONARY_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/"
TIMEOUT_SECONDS = 5
MAX_BYTES = 1_000_000
HTTP_NOT_FOUND = 404
# Both APIs reject urllib's default User-Agent (403); Wikimedia asks for a contact URL.
USER_AGENT = "OtterLang/1.0 (+https://github.com/haiquanng/otterlang)"

# certifi's bundle instead of the interpreter's: python.org builds on macOS ship without
# a usable CA store, which made every lookup fail with CERTIFICATE_VERIFY_FAILED.
_TLS = ssl.create_default_context(cafile=certifi.where())

__all__ = ["DictionaryEntry", "DictionaryUnavailableError", "Fetch", "fetch_entry"]


class DictionaryUnavailableError(Exception):
    """No source could be reached; try again on a later save."""


Fetch = Callable[[str], DictionaryEntry | None]

_Parser = Callable[[Any], DictionaryEntry | None]


def _get_json(url: str) -> Any | None:
    """Parsed JSON body, None on 404; raises DictionaryUnavailableError otherwise."""
    request = urllib.request.Request(  # noqa: S310 - fixed https hosts only
        url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS, context=_TLS) as response:  # noqa: S310
            body = response.read(MAX_BYTES + 1)
    except urllib.error.HTTPError as exc:
        if exc.code == HTTP_NOT_FOUND:
            return None
        raise DictionaryUnavailableError(url) from exc
    except OSError as exc:
        # URLError (DNS, TLS), connection resets and timeouts are all OSError.
        raise DictionaryUnavailableError(url) from exc
    if len(body) > MAX_BYTES:
        return None
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return None


def fetch_entry(lemma: str) -> DictionaryEntry | None:
    path = urllib.parse.quote(lemma, safe="")
    sources: list[tuple[str, _Parser]] = [
        (WIKTIONARY_URL + path, parse_wiktionary),
        (FREE_DICTIONARY_URL + path, parse_entries),
    ]
    unavailable: DictionaryUnavailableError | None = None
    for url, parse in sources:
        try:
            payload = _get_json(url)
        except DictionaryUnavailableError as exc:
            unavailable = exc
            continue
        entry = parse(payload) if payload is not None else None
        if entry is not None:
            return entry
    if unavailable is not None:
        raise unavailable
    return None


def get_dictionary_fetch() -> Fetch:
    """Dependency so tests can swap in a fake and never hit the network."""
    return fetch_entry

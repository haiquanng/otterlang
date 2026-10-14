"""Definition lookup from the Free Dictionary API (dictionaryapi.dev).

Only ever called with a fixed https host and a lemma path segment, never a user URL,
so the SSRF rules for crawling do not apply here. Every failure returns None.
"""

import json
import urllib.parse
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/"
TIMEOUT_SECONDS = 5
MAX_BYTES = 1_000_000


@dataclass(frozen=True)
class DictionaryEntry:
    pos: str
    definition: str
    phonetic: str | None = None
    examples: list[str] = field(default_factory=list)


Fetch = Callable[[str], DictionaryEntry | None]


def _phonetic(entry: dict[str, Any]) -> str | None:
    if isinstance(entry.get("phonetic"), str):
        return str(entry["phonetic"])
    for item in entry.get("phonetics") or []:
        if isinstance(item, dict) and isinstance(item.get("text"), str):
            return str(item["text"])
    return None


def parse_entries(payload: Any) -> DictionaryEntry | None:
    """Take the first definition of the first entry; tolerate any malformed shape."""
    if not isinstance(payload, list) or not payload or not isinstance(payload[0], dict):
        return None
    entry: dict[str, Any] = payload[0]
    for meaning in entry.get("meanings") or []:
        if not isinstance(meaning, dict):
            continue
        for definition in meaning.get("definitions") or []:
            if isinstance(definition, dict) and isinstance(definition.get("definition"), str):
                example = definition.get("example")
                return DictionaryEntry(
                    pos=str(meaning.get("partOfSpeech") or ""),
                    definition=str(definition["definition"]),
                    phonetic=_phonetic(entry),
                    examples=[example] if isinstance(example, str) else [],
                )
    return None


def fetch_entry(lemma: str) -> DictionaryEntry | None:
    url = API_URL + urllib.parse.quote(lemma, safe="")
    try:
        with urllib.request.urlopen(url, timeout=TIMEOUT_SECONDS) as response:  # noqa: S310
            body = response.read(MAX_BYTES + 1)
    except (OSError, ValueError):
        # HTTPError (404 for unknown words), timeouts and DNS failures are all OSError.
        return None
    if len(body) > MAX_BYTES:
        return None
    try:
        return parse_entries(json.loads(body))
    except json.JSONDecodeError:
        return None


def get_dictionary_fetch() -> Fetch:
    """Dependency so tests can swap in a fake and never hit the network."""
    return fetch_entry

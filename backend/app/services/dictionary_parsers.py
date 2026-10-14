"""Turn dictionary API payloads into a DictionaryEntry. Pure; tolerate any malformed shape."""

from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import Any


@dataclass(frozen=True)
class DictionaryEntry:
    pos: str
    definition: str
    phonetic: str | None = None
    examples: list[str] = field(default_factory=list)


class _TextOnly(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def plain_text(html: str) -> str:
    """Strip tags (Wiktionary definitions are HTML); we only ever store and show text."""
    parser = _TextOnly()
    parser.feed(html)
    parser.close()
    return " ".join("".join(parser.parts).split())


def parse_wiktionary(payload: Any) -> DictionaryEntry | None:
    """First non-empty English definition from Wiktionary's REST definition endpoint."""
    if not isinstance(payload, dict) or not isinstance(payload.get("en"), list):
        return None
    for usage in payload["en"]:
        if not isinstance(usage, dict):
            continue
        for definition in usage.get("definitions") or []:
            if not isinstance(definition, dict) or not isinstance(
                definition.get("definition"), str
            ):
                continue
            text = plain_text(definition["definition"])
            if not text:
                continue
            examples = [
                plain_text(example)
                for example in definition.get("examples") or []
                if isinstance(example, str)
            ][:1]
            return DictionaryEntry(
                pos=str(usage.get("partOfSpeech") or "").lower(),
                definition=text,
                examples=examples,
            )
    return None


def _phonetic(entry: dict[str, Any]) -> str | None:
    if isinstance(entry.get("phonetic"), str):
        return str(entry["phonetic"])
    for item in entry.get("phonetics") or []:
        if isinstance(item, dict) and isinstance(item.get("text"), str):
            return str(item["text"])
    return None


def parse_entries(payload: Any) -> DictionaryEntry | None:
    """First definition of the first entry from dictionaryapi.dev."""
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

"""Fetching and cleaning starter-library texts. Owner-only tooling, never on a request path.

The safe fetching itself lives in app.services.web_fetch, shared with the import endpoint.
"""

import json
import re
import urllib.parse
from typing import Any

from app.services.web_fetch import fetch_article, fetch_bytes, trim_to_paragraphs

# About a 6-8 minute read: long enough to be worth it, short enough for one sitting.
MAX_CHARS = 6000
WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"

# Sections after which a Wikipedia article stops being prose.
_END_SECTIONS = re.compile(
    r"See also|References|External links|Further reading|Notes|Bibliography|Sources"
)
_HEADING = re.compile(r"=+\s*(.*?)\s*=+")


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
    payload: Any = json.loads(fetch_bytes(f"{WIKIPEDIA_API}?{query}"))
    page = payload["query"]["pages"][0]
    if page.get("missing") or not page.get("extract"):
        raise LookupError(f"Wikipedia has no article '{title}'")
    return str(page["title"]), str(page["fullurl"]), clean_wikipedia_extract(str(page["extract"]))


def fetch_url(url: str) -> tuple[str, str]:
    """Return (title, main text) of any public page, extracted with trafilatura."""
    article = fetch_article(url, MAX_CHARS)
    return article.title, article.text

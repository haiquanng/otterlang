"""Import the starter library listed in seed_library.json into library_documents.

Run from backend/: python -m scripts.seed_library [--only "Coral reef"]
Safe to re-run: texts are upserted by URL. One failure is reported and skipped.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import psycopg
from psycopg.rows import dict_row

from app.config import get_settings
from app.repositories import library_documents
from scripts.library_sources import fetch_url, fetch_wikipedia

SEED_FILE = Path(__file__).with_name("seed_library.json")
WIKIPEDIA_LICENSE = "CC BY-SA 4.0"
KINDS = {"tech_blog", "ielts", "other"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="import a single entry by Wikipedia title or URL")
    args = parser.parse_args()

    seed: dict[str, list[dict[str, Any]]] = json.loads(SEED_FILE.read_text())
    added = updated = failed = 0
    with psycopg.connect(get_settings().database_url, row_factory=dict_row) as conn:
        for entry in seed.get("wikipedia", []) + seed.get("urls", []):
            key = entry.get("title") or entry.get("url")
            if args.only and args.only != key:
                continue
            if entry.get("kind") not in KINDS:
                print(f"skip {key}: kind must be one of {sorted(KINDS)}", file=sys.stderr)
                failed += 1
                continue
            try:
                if "url" in entry:
                    title, body = fetch_url(entry["url"])
                    url, source, license_name = entry["url"], entry.get("source", ""), None
                    title = entry.get("title") or title
                else:
                    title, url, body = fetch_wikipedia(entry["title"])
                    source, license_name = "Wikipedia", WIKIPEDIA_LICENSE
                new = library_documents.upsert(
                    conn,
                    title=title,
                    kind=entry["kind"],
                    url=url,
                    body=body,
                    source_name=source or url,
                    license_name=license_name,
                )
                conn.commit()
            except (OSError, ValueError, LookupError, KeyError) as exc:
                conn.rollback()
                print(f"fail {key}: {exc}", file=sys.stderr)
                failed += 1
                continue
            added, updated = (added + 1, updated) if new else (added, updated + 1)
            print(f"{'new ' if new else 'upd '} {title} ({len(body.split())} words)")
    print(f"done: {added} new, {updated} updated, {failed} failed")


if __name__ == "__main__":
    main()

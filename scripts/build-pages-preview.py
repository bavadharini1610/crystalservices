#!/usr/bin/env python3
"""Build a minimal, noindex copy of the static site for GitHub Pages preview."""

from __future__ import annotations

import re
import shutil
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class LocalReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        for attr in ("src", "href", "data-full", "poster"):
            value = values.get(attr) or ""
            self._add(value)
        for item in (values.get("srcset") or "").split(","):
            self._add(item.strip().split()[0] if item.strip() else "")

    def _add(self, value: str) -> None:
        value = value.split("#", 1)[0].split("?", 1)[0]
        if value and not value.startswith(("http:", "https:", "//", "data:", "#", "mailto:", "tel:", "javascript:")):
            self.references.add(value)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: build-pages-preview.py OUTPUT_DIRECTORY")
    destination = Path(sys.argv[1]).resolve()
    if destination == ROOT or (ROOT in destination.parents and destination != ROOT / "_site"):
        raise SystemExit("Output directory must be outside the source project, except for the Pages runner's _site folder")
    if destination.exists():
        raise SystemExit(f"Output directory already exists: {destination}")
    destination.mkdir(parents=True)

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    parser = LocalReferenceParser()
    parser.feed(html)

    # This staging-only robots directive prevents indexing while leaving the
    # source homepage's production robots policy and canonical untouched.
    robots_pattern = re.compile(r'(<meta\s+name=["\']robots["\']\s+content=["\'])[^"\']*(["\'])', re.I)
    html, matches = robots_pattern.subn(r"\1noindex, nofollow\2", html, count=1)
    if matches != 1:
        raise SystemExit("Expected exactly one robots meta tag in index.html")
    (destination / "index.html").write_text(html, encoding="utf-8")

    # Include the actual local references from the page and its stylesheets;
    # production robots.txt and sitemap.xml are intentionally omitted from the
    # preview artifact so they cannot misrepresent staging as production.
    references = set(parser.references)
    references.update(("css/styles.css", "js/script.js", "favicon.ico"))
    css_path = ROOT / "css/styles.css"
    for match in re.finditer(r"url\([\"']?([^\"')]+)", css_path.read_text(encoding="utf-8")):
        ref = match.group(1).split("#", 1)[0].split("?", 1)[0]
        if ref and not ref.startswith(("http:", "https:", "//", "data:")):
            references.add(str((Path("css") / ref).as_posix()) if not ref.startswith("/") else ref.lstrip("/"))

    for reference in sorted(references):
        source = (ROOT / reference).resolve()
        if ROOT not in source.parents or not source.is_file():
            raise SystemExit(f"Invalid or missing local reference: {reference}")
        target = destination / reference
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    print(f"Built preview into {destination} with {len(references)} referenced local files.")


if __name__ == "__main__":
    main()

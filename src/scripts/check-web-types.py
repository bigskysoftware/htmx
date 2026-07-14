#!/usr/bin/env python3
"""Check that htmx.web-types.json matches the docs.

Checks that every link points to a real page, the version is current,
and no attributes, elements, or events are missing or extra.
"""

from __future__ import annotations

import html
import json
import re
import sys
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
WEB_TYPES_PATH = ROOT / "src/editors/jetbrains/htmx.web-types.json"
CONTENT_DIR = ROOT / "www/src/content"
BASE_URL = "https://four.htmx.org"


def frontmatter_title(path: Path) -> str:
    match = re.search(r"^title:\s*[\"']?(.+?)[\"']?\s*$", path.read_text(), re.MULTILINE)
    return html.unescape(match.group(1)) if match else ""


def clean_segment(segment: str) -> str:
    return re.sub(r"^\d+-", "", segment)


def route_for(path: Path) -> str:
    rel = path.relative_to(CONTENT_DIR).with_suffix("")
    parts = [clean_segment(part) for part in rel.parts]
    if parts == ["index"]:
        return "/"
    if parts[-1] == "index":
        parts = parts[:-1]
    return "/" + "/".join(parts)


@lru_cache(maxsize=1)
def docs_routes() -> dict[str, Path]:
    return {
        route_for(path): path
        for path in CONTENT_DIR.rglob("*")
        if path.suffix in {".md", ".mdx"}
    }


def heading_slug(text: str) -> str:
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"</?([a-zA-Z][\w:-]*)>", r"\1", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"[*_~]", "", text).lower()
    text = re.sub(r"[^a-z0-9_ -]", "", text)
    return re.sub(r"[-\s]+", "-", text).strip("-")


@lru_cache(maxsize=None)
def anchors_for(path: Path) -> set[str]:
    text = path.read_text()
    anchors = set(re.findall(r"\bid=[\"']([^\"']+)[\"']", text))
    for line in text.splitlines():
        match = re.match(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$", line)
        if match:
            anchors.add(heading_slug(match.group(1)))
    return anchors


def read_web_types() -> dict:
    return json.loads(WEB_TYPES_PATH.read_text())


def doc_urls(value, path="$"):
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = f"{path}.{key}"
            if key == "doc-url":
                yield child_path, child
            else:
                yield from doc_urls(child, child_path)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from doc_urls(child, f"{path}[{index}]")


def validate_doc_urls(data: dict) -> list[str]:
    errors = []
    routes = docs_routes()
    for path, url in doc_urls(data):
        parsed = urlsplit(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        route = parsed.path.rstrip("/") or "/"
        if base != BASE_URL:
            errors.append(f"{path}: expected {BASE_URL}, got {base}")
            continue
        source = routes.get(route)
        if source is None:
            errors.append(f"{path}: {route} does not match a local docs route")
            continue
        if parsed.fragment and parsed.fragment not in anchors_for(source):
            errors.append(f"{path}: #{parsed.fragment} does not exist in {source.relative_to(ROOT)}")
    return errors


def names(items: list[dict], prefix: str | None = None) -> set[str]:
    return {
        item["name"]
        for item in items
        if prefix is None or item.get("doc-url", "").startswith(BASE_URL + prefix)
    }


def docs_titles(folder: str) -> set[str]:
    return {
        frontmatter_title(path)
        for path in (CONTENT_DIR / folder).glob("*.md")
        if path.name != "index.md"
    }


def htmx_event_docs() -> set[str]:
    events = set()
    for path in (CONTENT_DIR / "reference/03-events").glob("*.md"):
        if path.name == "index.md":
            continue
        title = frontmatter_title(path)
        if title.startswith("htmx:") and "{" not in title:
            events.add(title.removeprefix("htmx:"))
    return events


def compare(label: str, expected: set[str], actual: set[str]) -> list[str]:
    errors = []
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    if missing:
        errors.append(f"missing {label}: {', '.join(missing)}")
    if extra:
        errors.append(f"extra {label}: {', '.join(extra)}")
    return errors


def check() -> int:
    data = read_web_types()
    html = data["contributions"]["html"]
    js = data["contributions"]["js"]
    errors = []

    errors += validate_doc_urls(data)

    expected_version = json.loads((ROOT / "package.json").read_text())["version"]
    if data["version"] != expected_version:
        errors.append(f"web-types version is {data['version']}, expected {expected_version}")

    errors += compare(
        "core attributes",
        docs_titles("reference/01-attributes"),
        names(html["attributes"], "/reference/attributes/"),
    )
    errors += compare(
        "custom elements",
        {title.strip("<>") for title in docs_titles("reference/06-tags")},
        names(html["elements"]),
    )
    errors += compare(
        "core htmx events",
        htmx_event_docs(),
        names(js["htmx-events"], "/reference/events/"),
    )

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    print("htmx.web-types.json passed checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(check())

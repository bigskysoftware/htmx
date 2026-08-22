#!/usr/bin/env python3
"""Check that extension API documentation matches src/htmx.js."""

from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
START = "check_extension_api:start"
END = "check_extension_api:end"


def marked_section(path: Path) -> str:
    text = path.read_text()
    if text.count(START) != 1 or text.count(END) != 1:
        raise ValueError(f"{path.relative_to(ROOT)} must contain one {START} and one {END}")
    return text.split(START, 1)[1].split(END, 1)[0]


source = (ROOT / "src/htmx.js").read_text()
internal_api = re.search(
    r"this\.#internalAPI = \{\n(?P<body>.*?)\n {12}\};",
    source,
    re.DOTALL,
)
if internal_api is None:
    print("Could not find #internalAPI in src/htmx.js", file=sys.stderr)
    raise SystemExit(1)

runtime_names = re.findall(
    r"^ {16}([A-Za-z_$][\w$]*)(?=:|,)",
    internal_api.group("body"),
    re.MULTILINE,
)

try:
    skill_section = marked_section(ROOT / "src/skills/htmx-extension-authoring.md")
    docs_section = marked_section(ROOT / "www/src/content/docs/extension-authoring-guide.md")
except ValueError as error:
    print(error, file=sys.stderr)
    raise SystemExit(1) from error

documented_names = {
    "extension skill": re.findall(r"`api\.([A-Za-z0-9_]+)", skill_section),
    "website docs": re.findall(r"^- `([A-Za-z0-9_]+)", docs_section, re.MULTILINE),
}

errors = []
runtime_duplicates = sorted(name for name, count in Counter(runtime_names).items() if count > 1)
if runtime_duplicates:
    errors.append(f"src/htmx.js has duplicate internal API: {', '.join(runtime_duplicates)}")

expected = set(runtime_names)
for label, names in documented_names.items():
    duplicates = sorted(name for name, count in Counter(names).items() if count > 1)
    if duplicates:
        errors.append(f"{label} has duplicate internal API: {', '.join(duplicates)}")

    documented = set(names)
    if missing := sorted(expected - documented):
        errors.append(f"{label} missing internal API: {', '.join(missing)}")
    if extra := sorted(documented - expected):
        errors.append(f"{label} has stale internal API: {', '.join(extra)}")

if errors:
    print("\n".join(errors), file=sys.stderr)
    raise SystemExit(1)

print("Extension API documentation passed checks")

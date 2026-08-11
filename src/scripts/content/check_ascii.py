#!/usr/bin/env python3
"""Check that source files contain only ASCII characters."""

from pathlib import Path

SRC = Path(__file__).parents[2]
ERRORS = []

for f in list(SRC.glob("*.js")) + list(SRC.glob("*.d.ts")) + list(SRC.glob("ext/*.js")):
    for i, line in enumerate(f.read_bytes().splitlines(), 1):
        if any(b > 127 for b in line):
            ERRORS.append(f"{f.name}:{i}: {line!r}")

if ERRORS:
    print("Non-ASCII characters found:")
    for e in ERRORS:
        print(f"  {e}")
    raise SystemExit(1)

print("OK: All source files are ASCII-clean")

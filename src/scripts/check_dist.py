#!/usr/bin/env python3
"""Fail if dist/ext is not a complete, source-backed snapshot of src/ext.

Catches the class of release bug where `build:ext` copies new files but never
deletes renamed ones (4.0.0 shipped `hx-optimistic.min.js.map` with no JS
after #3958, and leftover `hx-compat.*`).
"""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SUFFIXES = (
    ".min.js.map",
    ".min.js.br",
    ".js.br",
    ".min.js",
    ".js.map",
    ".js",
)


def stem_of(name: str) -> str | None:
    for suffix in SUFFIXES:
        if name.endswith(suffix):
            return name[: -len(suffix)]
    return None


def check(src_ext: Path, dist_ext: Path) -> list[str]:
    errors: list[str] = []
    if not src_ext.is_dir():
        return [f"missing source dir: {src_ext}"]
    if not dist_ext.is_dir():
        return [f"missing dist dir: {dist_ext}"]

    src = {p.stem for p in src_ext.glob("*.js")}
    dist_files = [p.name for p in dist_ext.iterdir() if p.is_file()]
    dist_stems: set[str] = set()
    for name in dist_files:
        stem = stem_of(name)
        if stem is None:
            errors.append(f"unrecognized dist/ext file: {name}")
            continue
        dist_stems.add(stem)

    for name in sorted(src - dist_stems):
        errors.append(f"src/ext/{name}.js has no dist/ext output")
    for name in sorted(dist_stems - src):
        errors.append(f"dist/ext has leftover {name}.* with no src/ext/{name}.js")

    for stem in sorted(src & dist_stems):
        for required in (f"{stem}.js", f"{stem}.min.js"):
            if required not in dist_files:
                errors.append(f"missing {required}")

    for name in dist_files:
        if name.endswith(".map"):
            js = name[: -len(".map")]
            if js not in dist_files:
                errors.append(f"{name} has no matching {js}")

    return errors


def self_test() -> int:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        src = root / "src"
        dist = root / "dist"
        src.mkdir()
        dist.mkdir()
        (src / "hx-pending.js").write_text("/* pending */\n")
        (dist / "hx-pending.js").write_text("/* pending */\n")
        (dist / "hx-pending.min.js").write_text("/* pending */\n")
        (dist / "hx-optimistic.min.js.map").write_text("{}\n")
        (dist / "hx-compat.js").write_text("/* leftover */\n")
        (dist / "hx-compat.min.js").write_text("/* leftover */\n")
        errors = check(src, dist)
        expect = {
            "dist/ext has leftover hx-optimistic.* with no src/ext/hx-optimistic.js",
            "dist/ext has leftover hx-compat.* with no src/ext/hx-compat.js",
            "hx-optimistic.min.js.map has no matching hx-optimistic.min.js",
        }
        got = set(errors)
        if got != expect:
            print("self-test failed")
            print("expected:", *sorted(expect), sep="\n  ")
            print("got:", *sorted(got), sep="\n  ")
            return 1

        (dist / "hx-optimistic.min.js.map").unlink()
        (dist / "hx-compat.js").unlink()
        (dist / "hx-compat.min.js").unlink()
        clean = check(src, dist)
        if clean:
            print("self-test failed: expected clean dist after removing leftovers")
            print("got:", *clean, sep="\n  ")
            return 1
    print("OK: check_dist self-test passed")
    return 0


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args(argv)
    if args.self_test:
        return self_test()

    errors = check(args.root / "src" / "ext", args.root / "dist" / "ext")
    if errors:
        print("dist/ext is not a complete snapshot of src/ext:")
        for error in errors:
            print(f"  {error}")
        print("Wipe dist/ext at the start of build:ext and rebuild.")
        return 1
    print("OK: dist/ext matches src/ext")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

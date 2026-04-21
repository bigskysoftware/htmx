#!/usr/bin/env python3
"""htmx 2 → 4 migration checker.

Scans HTML template files for upgrade issues and prints clickable
file:line references with suggested fixes.

Usage:
    python htmx-upgrade-check.py [--ext .html,.php] [paths ...]
"""

import argparse
import os
import re
import sys
from html.parser import HTMLParser

# ---------------------------------------------------------------------------
# Migration rules
# ---------------------------------------------------------------------------

REMOVED_ATTRS = {
    "hx-vars": "use hx-vals with js: prefix",
    "hx-params": "use htmx:config:request event",
    "hx-prompt": "use hx-confirm with js: prefix",
    "hx-ext": "include extension scripts directly (no attribute needed in v4)",
    "hx-disinherit": "not needed (inheritance is explicit in v4)",
    "hx-inherit": "not needed (inheritance is explicit in v4)",
    "hx-request": "use hx-config",
    "hx-history": "removed (no localStorage cache in v4)",
    "hx-history-elt": "removed",
}

RENAMED_ATTRS = {
    "hx-disable": "rename to hx-ignore (hx-disable now means 'disable during request')",
    "hx-disabled-elt": "rename to hx-disable",
}

# Attributes that were implicitly inherited in htmx 2 (via getClosestAttributeValue,
# findAttributeTargets, or getValuesForElement walking up the tree).
INHERITABLE_ATTRS = {
    "hx-boost", "hx-confirm", "hx-encoding", "hx-headers", "hx-include",
    "hx-indicator", "hx-push-url", "hx-replace-url", "hx-select",
    "hx-select-oob", "hx-swap", "hx-sync", "hx-target", "hx-vals",
    # These are removed/renamed in v4 but we still flag inheritance patterns
    # so the user sees the full picture:
    "hx-disabled-elt",
}

REQUEST_ATTRS = {"hx-get", "hx-post", "hx-put", "hx-patch", "hx-delete"}

# htmx 2 event → htmx 4 event
EVENT_RENAMES = {
    "htmx:afterOnLoad": "htmx:after:init",
    "htmx:afterProcessNode": "htmx:after:init",
    "htmx:afterRequest": "htmx:after:request",
    "htmx:afterSettle": "htmx:after:swap",
    "htmx:afterSwap": "htmx:after:swap",
    "htmx:beforeCleanupElement": "htmx:before:cleanup",
    "htmx:beforeHistorySave": "htmx:before:history:update",
    "htmx:beforeOnLoad": "htmx:before:init",
    "htmx:beforeProcessNode": "htmx:before:process",
    "htmx:beforeRequest": "htmx:before:request",
    "htmx:beforeSwap": "htmx:before:swap",
    "htmx:configRequest": "htmx:config:request",
    "htmx:historyCacheMiss": "htmx:before:history:restore",
    "htmx:historyRestore": "htmx:before:history:restore",
    "htmx:load": "htmx:after:init",
    "htmx:oobAfterSwap": "htmx:after:swap",
    "htmx:oobBeforeSwap": "htmx:before:swap",
    "htmx:pushedIntoHistory": "htmx:after:history:push",
    "htmx:replacedInHistory": "htmx:after:history:replace",
    "htmx:responseError": "htmx:error",
    "htmx:sendError": "htmx:error",
    "htmx:swapError": "htmx:error",
    "htmx:targetError": "htmx:error",
    "htmx:timeout": "htmx:error",
}

REMOVED_EVENTS = {
    "htmx:validation:validate", "htmx:validation:failed",
    "htmx:validation:halted", "htmx:xhr:loadstart",
    "htmx:xhr:loadend", "htmx:xhr:progress", "htmx:xhr:abort",
}

SSE_EVENT_RENAMES = {
    "htmx:sseOpen": "htmx:after:sse:connection",
    "htmx:sseError": "htmx:sse:error",
    "htmx:sseBeforeMessage": "htmx:before:sse:message",
    "htmx:sseMessage": "htmx:after:sse:message",
    "htmx:sseClose": "htmx:sse:close",
}

WS_EVENT_RENAMES = {
    "htmx:wsOpen": "htmx:after:ws:connection",
    "htmx:wsClose": "htmx:ws:close",
    "htmx:wsConfigSend": "htmx:before:ws:request",
    "htmx:wsBeforeSend": "htmx:before:ws:request",
    "htmx:wsAfterSend": "htmx:after:ws:request",
    "htmx:wsBeforeMessage": "htmx:before:ws:message",
    "htmx:wsAfterMessage": "htmx:after:ws:message",
}

# Extension attribute renames
EXT_ATTR_RENAMES = {
    "sse-connect": "rename to hx-sse:connect",
    "sse-swap": "removed — SSE now integrates with standard htmx request pipeline",
    "ws-connect": "rename to hx-ws:connect",
    "ws-send": "rename to hx-ws:send",
}

# Old JS API calls
REMOVED_JS_API = {
    "htmx.addClass": "use element.classList.add()",
    "htmx.removeClass": "use element.classList.remove()",
    "htmx.toggleClass": "use element.classList.toggle()",
    "htmx.closest": "use element.closest()",
    "htmx.remove": "use element.remove()",
    "htmx.off": "use removeEventListener() (htmx.on() returns the callback)",
    "htmx.location": "use htmx.ajax()",
    "htmx.logAll": "use htmx.config.logAll = true",
    "htmx.logNone": "use htmx.config.logAll = false",
    "htmx.defineExtension": "use htmx.registerExtension()",
}

# Old config key → new config key
CONFIG_RENAMES = {
    "defaultSwapStyle": "defaultSwap",
    "globalViewTransitions": "transitions",
    "historyEnabled": "history",
    "includeIndicatorStyles": "includeIndicatorCSS",
}

REMOVED_CONFIG = {
    "addedClass", "allowEval", "allowNestedOobSwaps", "allowScriptTags",
    "attributesToSettle", "defaultSwapDelay", "disableSelector",
    "getCacheBusterParam", "historyCacheSize", "methodsThatUseUrlParams",
    "refreshOnHistoryMiss", "responseHandling", "scrollBehavior",
    "scrollIntoViewOnBoost", "selfRequestsOnly", "settlingClass",
    "swappingClass", "triggerSpecsCache", "useTemplateFragments",
    "withCredentials", "wsBinaryType", "wsReconnectDelay",
}

# Old hx-swap show/scroll combined syntax: show:#selector:position
SWAP_OLD_SYNTAX = re.compile(r"(show|scroll):([^:\s]+):(top|bottom)")

# All old event names for text scanning
ALL_OLD_EVENTS = {**EVENT_RENAMES, **SSE_EVENT_RENAMES, **WS_EVENT_RENAMES}

# Lowercase lookup for hx-on attribute matching (html.parser lowercases attr names)
ALL_OLD_EVENTS_LOWER = {k.lower(): (k, v) for k, v in ALL_OLD_EVENTS.items()}
REMOVED_EVENTS_LOWER = {e.lower(): e for e in REMOVED_EVENTS}

# Removed response headers (flag if found in templates/JS)
REMOVED_RESPONSE_HEADERS = {
    "HX-Trigger-After-Swap": "use HX-Trigger or JavaScript instead",
    "HX-Trigger-After-Settle": "use HX-Trigger or JavaScript instead",
}

# ---------------------------------------------------------------------------
# Simple DOM tree
# ---------------------------------------------------------------------------

class Node:
    __slots__ = ("tag", "attrs", "line", "children", "parent")

    def __init__(self, tag, attrs, line):
        self.tag = tag
        self.attrs = attrs  # dict {name: value}
        self.line = line
        self.children = []
        self.parent = None

    def descendants(self):
        """Yield all descendant nodes (depth-first)."""
        for child in self.children:
            yield child
            yield from child.descendants()

    def has_request_attr(self):
        return bool(REQUEST_ATTRS & set(self.attrs))


VOID_ELEMENTS = frozenset({
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
})


class TreeBuilder(HTMLParser):
    """Lenient HTML parser that builds a simple DOM tree with line numbers."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.root = Node("root", {}, 0)
        self.current = self.root

    def handle_starttag(self, tag, attrs):
        line, _ = self.getpos()
        node = Node(tag, dict(attrs), line)
        node.parent = self.current
        self.current.children.append(node)
        if tag.lower() not in VOID_ELEMENTS:
            self.current = node

    def handle_startendtag(self, tag, attrs):
        line, _ = self.getpos()
        node = Node(tag, dict(attrs), line)
        node.parent = self.current
        self.current.children.append(node)

    def handle_endtag(self, tag):
        node = self.current
        while node.parent and node.tag != tag:
            node = node.parent
        if node.parent:
            self.current = node.parent

    def error(self, message):
        pass


# ---------------------------------------------------------------------------
# Template syntax stripping
# ---------------------------------------------------------------------------

def _keep_newlines(match):
    return "\n" * match.group().count("\n")


def strip_template_syntax(text):
    """Replace template tags with whitespace, preserving line numbers."""
    # Django / Jinja2
    text = re.sub(r"\{%.*?%\}", _keep_newlines, text, flags=re.DOTALL)
    text = re.sub(r"\{\{.*?\}\}", lambda m: "X" + _keep_newlines(m), text, flags=re.DOTALL)
    # PHP
    text = re.sub(r"<\?(?:php)?.*?\?>", _keep_newlines, text, flags=re.DOTALL)
    # ERB
    text = re.sub(r"<%.*?%>", _keep_newlines, text, flags=re.DOTALL)
    return text


# ---------------------------------------------------------------------------
# Issue collection
# ---------------------------------------------------------------------------

class Issue:
    __slots__ = ("file", "line", "category", "message")

    def __init__(self, file, line, category, message):
        self.file = file
        self.line = line
        self.category = category
        self.message = message

    def __str__(self):
        return f"{self.file}:{self.line}: [{self.category}] {self.message}"


# ---------------------------------------------------------------------------
# Tree-based checks
# ---------------------------------------------------------------------------

def check_node(node, filepath, issues):
    """Check a single node for migration issues, then recurse into children."""
    attrs = node.attrs

    for attr_name in attrs:
        name_lower = attr_name.lower()

        # Removed attributes
        if name_lower in REMOVED_ATTRS:
            issues.append(Issue(filepath, node.line, "removed-attr",
                                f"{attr_name} is removed → {REMOVED_ATTRS[name_lower]}"))

        # Renamed attributes
        if name_lower in RENAMED_ATTRS:
            issues.append(Issue(filepath, node.line, "renamed-attr",
                                f"{attr_name} → {RENAMED_ATTRS[name_lower]}"))

        # Extension attributes (SSE / WS)
        if name_lower in EXT_ATTR_RENAMES:
            issues.append(Issue(filepath, node.line, "ext",
                                f"{attr_name} → {EXT_ATTR_RENAMES[name_lower]}"))

        # Old event names in hx-on attributes
        if name_lower.startswith("hx-on:") or name_lower.startswith("hx-on::"):
            check_hx_on_event(node, attr_name, filepath, issues)

        # Old hx-swap show/scroll combined syntax
        if name_lower == "hx-swap" and attrs[attr_name]:
            check_swap_syntax(node, attrs[attr_name], filepath, issues)

    for child in node.children:
        check_node(child, filepath, issues)


def check_hx_on_event(node, attr_name, filepath, issues):
    """Check if an hx-on: attribute references an old event name."""
    lower = attr_name.lower()
    if lower.startswith("hx-on::"):
        event_lower = "htmx:" + lower[7:]
    elif lower.startswith("hx-on:"):
        event_lower = lower[6:]
    else:
        return

    if event_lower in ALL_OLD_EVENTS_LOWER:
        original, new_name = ALL_OLD_EVENTS_LOWER[event_lower]
        issues.append(Issue(filepath, node.line, "renamed-event",
                            f'{attr_name} uses old event name "{original}" → '
                            f'use hx-on:{new_name}'))
    elif event_lower in REMOVED_EVENTS_LOWER:
        issues.append(Issue(filepath, node.line, "removed-event",
                            f'{attr_name} uses removed event '
                            f'{REMOVED_EVENTS_LOWER[event_lower]}'))


def check_swap_syntax(node, value, filepath, issues):
    """Check for old show:#selector:position syntax in hx-swap."""
    m = SWAP_OLD_SYNTAX.search(value)
    if m:
        kind, selector, position = m.groups()
        target_key = f"{kind}Target"
        issues.append(Issue(filepath, node.line, "swap-syntax",
                            f'old {kind}:{selector}:{position} syntax → '
                            f'use {kind}:{position} {target_key}:{selector}'))


def check_inheritance(root, filepath, issues):
    """Detect implicit inheritance patterns: inheritable attr on ancestor,
    request attr on descendant."""
    def walk(node):
        for attr_name in node.attrs:
            name_lower = attr_name.lower()
            if name_lower not in INHERITABLE_ATTRS:
                continue
            # Already has :inherited suffix — nothing to flag
            if ":inherited" in attr_name:
                continue

            # For hx-boost, any descendant <a> or <form> is affected
            if name_lower == "hx-boost":
                for desc in node.descendants():
                    if desc.tag in ("a", "form"):
                        issues.append(Issue(filepath, node.line, "inheritance",
                                            f'{attr_name} needs :inherited suffix '
                                            f'(descendant <{desc.tag}> on line {desc.line} '
                                            f'will no longer inherit it)'))
                        break  # one warning per attr is enough
                continue

            # For other attrs, check for descendants that make requests
            for desc in node.descendants():
                if desc.has_request_attr():
                    issues.append(Issue(filepath, node.line, "inheritance",
                                        f'{attr_name} needs :inherited suffix '
                                        f'(descendant on line {desc.line} has '
                                        f'{next(a for a in desc.attrs if a in REQUEST_ATTRS)})'))
                    break

        for child in node.children:
            walk(child)

    walk(root)


# ---------------------------------------------------------------------------
# Text-based checks (JS / script / config)
# ---------------------------------------------------------------------------

def check_text(raw_text, filepath, issues):
    """Scan raw file text line-by-line for old event names, JS API, and config."""
    for lineno, line in enumerate(raw_text.splitlines(), 1):
        # Old event names in JS strings (addEventListener, htmx.on, etc.)
        for old_event, new_event in ALL_OLD_EVENTS.items():
            if old_event in line:
                # Skip if this is inside an hx-on attribute (handled by tree check)
                if re.search(r'hx-on\S*=', line):
                    continue
                issues.append(Issue(filepath, lineno, "old-event",
                                    f'old event name "{old_event}" → "{new_event}"'))

        for removed_event in REMOVED_EVENTS:
            if removed_event in line:
                if re.search(r'hx-on\S*=', line):
                    continue
                issues.append(Issue(filepath, lineno, "removed-event",
                                    f'removed event "{removed_event}"'))

        # Old JS API methods
        for old_api, replacement in REMOVED_JS_API.items():
            # Match htmx.methodName( to avoid false positives
            if re.search(re.escape(old_api) + r"\s*\(", line):
                issues.append(Issue(filepath, lineno, "old-api",
                                    f"{old_api}() is removed → {replacement}"))

        # Old config key names
        for old_cfg, new_cfg in CONFIG_RENAMES.items():
            if re.search(r"(?:config\.|['\"])" + re.escape(old_cfg) + r"(?:['\"]|\s*[=:])", line):
                issues.append(Issue(filepath, lineno, "renamed-config",
                                    f'config "{old_cfg}" → "{new_cfg}"'))

        for removed_cfg in REMOVED_CONFIG:
            if re.search(r"(?:config\.|['\"])" + re.escape(removed_cfg) + r"(?:['\"]|\s*[=:])", line):
                issues.append(Issue(filepath, lineno, "removed-config",
                                    f'config "{removed_cfg}" is removed'))

        # Removed response headers in JS
        for header, fix in REMOVED_RESPONSE_HEADERS.items():
            if header in line:
                issues.append(Issue(filepath, lineno, "removed-header",
                                    f'"{header}" is removed → {fix}'))


# ---------------------------------------------------------------------------
# File processing
# ---------------------------------------------------------------------------

JS_EXTENSIONS = frozenset({".js", ".mjs", ".cjs", ".ts", ".mts", ".cts", ".jsx", ".tsx"})


def check_file(filepath):
    """Check a single file for all migration issues."""
    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            raw_text = f.read()
    except OSError as e:
        print(f"warning: cannot read {filepath}: {e}", file=sys.stderr)
        return []

    issues = []
    _, ext = os.path.splitext(filepath)

    # HTML tree-based checks (skip for pure JS/TS files)
    if ext.lower() not in JS_EXTENSIONS:
        cleaned = strip_template_syntax(raw_text)
        builder = TreeBuilder()
        try:
            builder.feed(cleaned)
        except Exception:
            pass
        check_node(builder.root, filepath, issues)
        check_inheritance(builder.root, filepath, issues)

    # Text-based checks (JS patterns — applies to all file types)
    check_text(raw_text, filepath, issues)

    # Deduplicate (same file+line+category+message)
    seen = set()
    deduped = []
    for issue in issues:
        key = (issue.line, issue.category, issue.message)
        if key not in seen:
            seen.add(key)
            deduped.append(issue)

    deduped.sort(key=lambda i: i.line)
    return deduped


def collect_files(paths, extensions):
    """Collect files matching the given extensions from paths."""
    files = []
    for path in paths:
        if os.path.isfile(path):
            files.append(path)
        elif os.path.isdir(path):
            for dirpath, _, filenames in os.walk(path):
                for fn in filenames:
                    if any(fn.endswith(ext) for ext in extensions):
                        files.append(os.path.join(dirpath, fn))
    files.sort()
    return files


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

COLORS = {
    "removed-attr": "\033[31m",     # red
    "renamed-attr": "\033[33m",     # yellow
    "inheritance": "\033[35m",      # magenta
    "renamed-event": "\033[33m",    # yellow
    "removed-event": "\033[31m",    # red
    "swap-syntax": "\033[33m",      # yellow
    "ext": "\033[36m",              # cyan
    "old-event": "\033[33m",        # yellow
    "old-api": "\033[31m",          # red
    "renamed-config": "\033[33m",   # yellow
    "removed-config": "\033[31m",   # red
    "removed-header": "\033[31m",   # red
}
RESET = "\033[0m"


DEFAULT_EXTENSIONS = [".html", ".php", ".js", ".ts", ".jinja", ".jinja2", ".j2", ".erb", ".hbs"]


def main():
    parser = argparse.ArgumentParser(
        description="Scan HTML templates for htmx 2 → 4 migration issues.")
    parser.add_argument("paths", nargs="*", default=["."],
                        help="Files or directories to scan (default: current directory)")
    parser.add_argument("--ext", action="append", default=[],
                        help="Additional file extensions to scan (can be used multiple times, "
                             "e.g. --ext .vue --ext .svelte)")
    parser.add_argument("--no-color", action="store_true",
                        help="Disable colored output")
    args = parser.parse_args()

    extensions = list(DEFAULT_EXTENSIONS)
    for ext in args.ext:
        for e in ext.split(","):
            e = e.strip()
            if not e.startswith("."):
                e = "." + e
            if e not in extensions:
                extensions.append(e)

    use_color = not args.no_color and sys.stdout.isatty()

    ext_list = ", ".join(extensions)
    print(f"File extensions: {ext_list}", file=sys.stderr)
    print(f"Use --ext to add more (e.g. --ext .vue --ext .svelte)\n", file=sys.stderr)

    files = collect_files(args.paths, extensions)
    if not files:
        print(f"No files found with extensions: {ext_list}", file=sys.stderr)
        return

    print(f"Scanning {len(files)} file(s)...\n", file=sys.stderr)

    total_issues = 0
    files_with_issues = 0

    for filepath in files:
        issues = check_file(filepath)
        if issues:
            files_with_issues += 1
            total_issues += len(issues)
            for issue in issues:
                if use_color:
                    color = COLORS.get(issue.category, "")
                    print(f"{issue.file}:{issue.line}: {color}[{issue.category}]{RESET} {issue.message}")
                else:
                    print(issue)

    print(f"\nFound {total_issues} issue(s) in {files_with_issues} of {len(files)} file(s).",
          file=sys.stderr)
    sys.exit(1 if total_issues > 0 else 0)


if __name__ == "__main__":
    main()

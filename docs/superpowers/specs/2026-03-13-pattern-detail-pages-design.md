# Pattern Detail Pages Design

## Summary

Redesign the pattern detail pages to lead with a live interactive demo powered by a Service Worker, followed by explanatory prose. Convert pattern files from `.md` to `.mdx` for extensibility, add icons to pattern sidebar links, and establish a clear repeatable template for all pattern pages.

## Architecture

### Service Worker Demo System

Pattern files define fake server routes using inline `<script>` blocks with `init()`, `onGet()`, `onPost()`, `onPut()`, `onDelete()` functions. A Service Worker intercepts htmx fetch requests and relays them to the page for handling via MessageChannel.

**Components:**

1. **`www/public/js/demo-sw.js`** — Service Worker registered with `scope: '/'`. Intercepts all fetch requests but only handles those that a page-side shim claims. Uses MessageChannel to ask the page for the response. If the page doesn't respond within a timeout, the SW falls through to the real network.

2. **`www/public/js/demo-shim.js`** — Page-side shim that replaces the old `fetch-mock.js` reference. Responsibilities:
   - Registers the Service Worker and waits for it to be active
   - Provides the `init()` / `onGet()` / `onPost()` / `onPut()` / `onDelete()` API (same signatures as today, including the third `responseHeaders` parameter used by some patterns)
   - Stores route definitions in a local registry with support for both string and RegExp URL patterns
   - Listens for SW messages, matches routes (string equality or regex test), runs handlers, sends response back (both HTML body and any custom response headers)
   - Injects initial demo content into `#demo-content` using `_hyperscript` (same mechanism as today's `init()`)

3. **Updated `www/src/components/Demo.astro`** — Swaps `fetch-mock.js` for `demo-shim.js`. Visual styling TBD separately.

**Request flow:**

```
1. htmx makes fetch (e.g. GET /contacts/?page=2)
2. Service Worker intercepts the request
3. SW sends request details (url, method, body, params) to page via MessageChannel
4. Page-side shim finds matching route handler (string or regex), executes it
5. Shim sends response back through MessageChannel: { body: html, status: 200, headers: {...} }
6. SW wraps it in new Response(body, { status, headers }) and returns to htmx
7. If no handler matches, shim responds with { body: null } and SW falls through to real network fetch
```

**Timeout/fallthrough:** The SW sets a timeout (e.g. 200ms) when waiting for the page's MessageChannel response. If the timeout fires (page has no shim loaded, or shim has no matching route), the SW falls through to `fetch(event.request)`. This prevents requests from hanging on pages without demos or for unmatched routes.

**Key properties:**
- All requests/responses appear in the browser Network tab (real SW interception)
- Loading indicators work naturally (htmx sees a real async fetch)
- The SW can add a small configurable delay before responding so indicators are visible
- Pattern authors use the exact same `init()` / `onGet()` / etc. API as today
- Route matching supports both string paths and RegExp patterns (matching happens on the page side, not in the SW, since RegExp can't be serialized over MessageChannel)
- Handlers can set custom response headers via a third parameter (e.g. `HX-Trigger`)
- `init()` waits for SW readiness before injecting the htmx load trigger via `_hyperscript`
- Some demos (e.g. dialogs) swap content outside `#demo-content` — into `body` or other targets. This is expected and works fine since the SW intercepts at the network level regardless of swap target.

### Pattern File Format

Convert all pattern files from `.md` to `.mdx`. Add `icon` to frontmatter.

**Example converted file (`click-to-load.mdx`):**

```mdx
---
title: "Click to Load"
description: Load content when you click an element
icon: "icon-[mdi--cursor-pointer]"
---

import Demo from '../../components/Demo.astro';

<Demo />

This example shows how to implement click-to-load the next page in a table of data...

<!-- code blocks, explanations, etc. -->

<script>
  // Route definitions (same as today)
  init("/demo", function(request, params) { ... });
  onGet(/\/agents.*/, function(request, params) { ... });
</script>
```

The `icon` field is a CSS class string (Iconify/UnoCSS format). Used in the sidebar and on the patterns index page. The existing `iconMap` in `patterns/index.mdx` is removed in favor of reading icons from each file's frontmatter.

**Migration notes:**
- Remove `[//]: # ({{ demo_environment() }})` Jinja remnants from all files — these are from the old htmx.org site and will cause `.mdx` parse errors if left as-is
- Pattern files with commented-out demo scripts: leave them as-is during this work. Restoring broken/incomplete demos is a separate effort.
- Authors may optionally include related links at the end as regular markdown content (no structured frontmatter for this)

## Page Template

Pattern detail pages follow this structure:

```
Breadcrumbs

Title
Brief description (from frontmatter)

┌──────────────────────────────┐
│  Live Demo (hero position)   │
│  (Demo.astro component)      │
└──────────────────────────────┘

Explanation prose
  - Code blocks with syntax highlighting
  - Step-by-step walkthrough
  - Inline <script> defining demo routes (at end of file)
  - Optionally: related patterns/links (just markdown)

Prev / Next pagination
```

**Key change:** The demo moves above the prose to hero position. The page leads with the interactive experience, then explains how it works.

**Demo placement in content:** Since ContentLayout.astro renders `<Content/>` (the markdown body), the Demo component and route scripts are embedded in the `.mdx` content itself. Pattern authors `import Demo` and place `<Demo />` at the top of their content body.

## Sidebar Icons

The patterns sidebar (`Sidebar.astro`) renders icons next to individual pattern links within the grouped `<details>` sections (the file list under each category like Loading, Forms, etc.). When `isPatterns` is true and `file.frontmatter.icon` exists, an `<i>` element with the icon class is rendered before the link text:

```html
<i class="size-4 shrink-0 {file.frontmatter.icon}"></i>
```

Icons are not rendered on category group headers — only on individual pattern links.

## Files Changed

| File | Change |
|------|--------|
| `www/public/js/demo-sw.js` | New — Service Worker |
| `www/public/js/demo-shim.js` | New — page-side route registry + SW communication |
| `www/src/components/Demo.astro` | Update script src from `fetch-mock.js` to `demo-shim.js` |
| `www/src/components/Sidebar.astro` | Add icon rendering for patterns collection |
| `www/src/content/patterns/**/*.md` | Convert to `.mdx`, add `icon` frontmatter, add `<Demo />` import/usage, remove Jinja remnants |
| `www/src/content/patterns/index.mdx` | Remove `iconMap`, read icons from frontmatter instead |

## Out of Scope

- Demo.astro visual styling/chrome redesign (separate effort)
- Restoring commented-out/broken demo scripts in pattern files
- New pattern content

# Pattern Detail Pages Design

## Summary

Redesign the pattern detail pages to lead with a live interactive demo powered by a Service Worker, followed by explanatory prose. Convert pattern files from `.md` to `.mdx`, add icons to pattern sidebar links, and establish a clear repeatable template for all pattern pages. The demo system supports HTTP, SSE, and WebSocket mocking with a minimal `server.*` API.

## Architecture

### Demo System Overview

Pattern files define mock server behavior using inline `<script>` blocks with a `server.*` API. The system supports three protocols:

| Protocol | Mechanism | Network Tab | Console Logs |
|----------|-----------|-------------|--------------|
| HTTP (GET, POST, PUT, DELETE) | Service Worker interception | Yes | No |
| SSE (EventSource) | Service Worker + ReadableStream | Yes | No |
| WebSocket | Client-side `WebSocket` patch | **No** (browser limitation) | Yes |

**WebSocket limitation:** Service Workers cannot intercept WebSocket upgrades. No tool can make fake WS connections appear in the Network tab. WebSocket demos use a client-side mock that patches `window.WebSocket` for registered paths. All WS events are logged to the console with styled, clearly labeled output so developers can follow the message flow.

### The `server` API

A single global `server` object provides the entire authoring API:

```js
// HTTP routes — handler receives (req) and returns HTML string or response object
server.get(path, handler)
server.post(path, handler)
server.put(path, handler)
server.delete(path, handler)

// req object:
// {
//   url,             // full URL string
//   method,          // "GET", "POST", etc.
//   params,          // merged object: query string params + parsed form body
//                    // e.g. params.page, params.search, params['name']
//                    // (matches the old `params` argument from onGet/onPost)
//   headers,         // request headers
// }
//
// Return value:
//   string           — treated as HTML body with 200 status
//   { body, status?, headers? } — full control over response

// Simulated latency — adds delay before all responses (default: 0)
server.delay(ms)

// SSE — handler receives (stream)
// stream.send({ event?, data }) to push events
// stream.close() to end the stream
// stream.onclose fires when client disconnects (SW detects ReadableStream cancellation)
server.sse(path, handler)

// WebSocket — handler receives (socket)
// socket.send(data) to send to client
// socket.onmessage = (data) => {} to receive from client
// socket.close() to close connection
server.ws(path, handler)

// Trigger initial demo load — waits for SW, then injects htmx load trigger into #demo-content
// The path argument is arbitrary (e.g. "/demo", "/init", "/modal")
server.start(path)
```

`path` can be a string or RegExp for all methods.

**Using without `server.start()`:** Not all patterns use the `#demo-content` container. Some patterns (e.g. file-upload) have static HTML in the markdown with only POST handlers registered. Calling `server.start()` is optional — route handlers work regardless. The demo container stays hidden if `server.start()` is never called.

### Service Worker (`www/public/js/demo-sw.js`)

Registered with `scope: '/'`. Intercepts all fetch requests but only handles those claimed by the page-side shim. Uses `skipWaiting()` + `clients.claim()` so updates take effect immediately.

**HTTP request flow:**

```
1. htmx makes fetch (e.g. GET /contacts/?page=2)
2. SW intercepts, sends request details to page via MessageChannel
3. Page-side shim matches route (string or regex), runs handler
4. Shim sends response: { body, status, headers }
5. SW applies configured delay (if any), then returns new Response(body, { status, headers })
6. If no match, shim responds { body: null }, SW falls through to real network
```

**SSE request flow:**

```
1. EventSource("/events") triggers a GET request
2. SW intercepts, creates a ReadableStream, returns Response immediately
   with Content-Type: text/event-stream headers
3. SW stores the stream controller keyed by a connection ID
4. SW notifies page: "SSE connection opened" with the connection ID and path
5. Page runs server.sse() handler, which receives a stream object
6. Handler calls stream.send({ event, data })
7. Page posts message to SW with event data + connection ID
8. SW looks up the stream controller by ID, writes "event: ...\ndata: ...\n\n"
9. Browser's EventSource receives the event normally
10. If client disconnects (ReadableStream cancelled), SW notifies page, stream.onclose fires
```

**Timeout/fallthrough:** The SW sets a configurable timeout (default ~300ms) when waiting for the page's MessageChannel response. If no response arrives (page has no shim, or no matching route), the SW falls through to `fetch(event.request)`. This value is tunable — higher values reduce risk of missed interceptions on slow devices, lower values reduce fallthrough latency on non-demo pages.

### Page-Side Shim (`www/public/js/demo-shim.js`)

Replaces the old `fetch-mock.js`. Responsibilities:

- Registers the SW and waits for it to be active
- Provides the `server.*` API (route registry, SSE stream management, WS mock)
- Listens for SW messages, matches routes, runs handlers, sends responses back
- Parses query strings and form-encoded bodies into a merged `params` object on `req`
- Patches `window.WebSocket` to intercept connections to registered WS paths (non-registered paths pass through to real WebSocket)
- Logs WS events to console with styled labels:
  ```
  [demo-ws] ↗ client → /chat: "hello"
  [demo-ws] ↙ server → /chat: "Echo: hello"
  [demo-ws] ✕ closed /chat
  ```
- `server.start(path)`: waits for SW ready, sets `#demo-content` innerHTML to an htmx load trigger, calls `htmx.process()` (no _hyperscript dependency)

### Demo Component (`www/src/components/Demo.astro`)

Rendered by ContentLayout.astro automatically for pattern detail pages — authors never import or reference it. ContentLayout checks `collection === 'patterns' && !isIndex` and renders `<Demo />` in the `before-content` slot. If no `server.start()` is called, the demo container stays hidden.

The component loads `demo-shim.js` and provides the `#demo-content` container. Visual styling TBD separately.

### Pattern File Format

Convert pattern files from `.md` to `.mdx`. Add `icon` to frontmatter.

**Example (`click-to-load.mdx`):**

```mdx
---
title: "Click to Load"
description: Load content when you click an element
icon: "icon-[mdi--cursor-pointer]"
---

<script>
const dataStore = function() {
  let id = 9;
  function generate() {
    id++;
    let hash = "";
    for (let i = 0; i < 15; i++) hash += "ABCDEFG0123456789"[Math.floor(Math.random() * 16)];
    return { name: "Agent Smith", email: `void${id}@null.org`, id: hash };
  }
  return { contactsForPage: () => Array.from({ length: 10 }, generate) };
}();

server.get("/demo", () => `
  <table><thead><tr><th>Name</th><th>Email</th><th>ID</th></tr></thead>
  <tbody>${rows(1)}</tbody></table>
`);

server.get(/\/contacts.*/, (req) => rows(req.params.page));

function rows(page) {
  return dataStore.contactsForPage().map(c =>
    `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.id}</td></tr>`
  ).join('') + `<tr id="replaceMe"><td colspan="3"><center>
    <button class="btn primary" hx-get="/contacts?page=${+page + 1}"
            hx-target="#replaceMe" hx-swap="outerHTML">
      Load More Agents... <img class="htmx-indicator" src="/img/bars.svg" alt="">
    </button></center></td></tr>`;
}

server.start("/demo");
</script>

This example shows how to implement click-to-load the next page in a table of data.
The crux of the demo is the final row:

...
```

**Key authoring properties:**
- No imports needed — Demo component rendered by layout automatically
- `server.*` API is available globally (provided by the shim)
- Script block can go anywhere in the file (top recommended so demo loads first)
- Route paths support strings and RegExp
- `req.params` merges query string + form body (same shape as old `params` argument)
- Handlers return HTML strings, or `{ body, status, headers }` for custom response headers/status
- `server.start()` is optional — patterns with inline HTML and only POST/PUT handlers work without it
- `server.delay(ms)` sets simulated latency for all responses (useful for loading indicator demos)

**Migration notes:**
- Remove all Jinja remnants: both `[//]: # ({{ demo_environment() }})` (markdown comment form) and bare `{{ demo_environment() }}` (raw text form). Both cause `.mdx` parse errors since MDX interprets `{` as JSX expressions.
- Replace `init(path, handler)` with `server.get(path, handler)` + `server.start(path)`
- Replace `onGet(path, handler)` with `server.get(path, handler)` (same for post/put/delete)
- The old two-argument `function(request, params)` becomes `function(req)` where `req.params` is the merged params object
- The third `responseHeaders` parameter (used by e.g. progress-bar) becomes a return value: `return { body: html, headers: { "HX-Trigger": "done" } }`
- Replace `server.autoRespondAfter = 2000` with `server.delay(2000)`
- All `<script>` variants (`<script>`, `<script type="text/javascript">`) need handler migration
- The `animations.md` commented-out code uses an older sinon-style `fakeServer` API — this will need a different migration if restored (out of scope for now)
- Pattern files with commented-out demo scripts: leave as-is. Restoring broken demos is a separate effort.
- Authors may include related links at the end as regular markdown content

## Page Template

Pattern detail pages follow this structure:

```
Breadcrumbs

Title
Brief description (from frontmatter)

┌──────────────────────────────┐
│  Live Demo (hero position)   │
│  (rendered by layout)        │
└──────────────────────────────┘

Explanation prose
  - Code blocks with syntax highlighting
  - Step-by-step walkthrough
  - Optionally: related patterns/links (just markdown)

Prev / Next pagination
```

**Key change:** The demo is the hero element. The page leads with the interactive experience, then explains how it works.

**Demo rendering:** ContentLayout.astro checks `collection === 'patterns' && !isIndex` and renders `<Demo />` in the `before-content` slot. The pattern file's `<script>` block registers routes and optionally calls `server.start()`, which triggers the initial load into the demo container.

## Sidebar Icons

The patterns sidebar (`Sidebar.astro`) renders icons next to individual pattern links within the grouped `<details>` sections. When `isPatterns` is true and `file.frontmatter.icon` exists, an `<i>` element with the icon class is rendered before the link text:

```html
<i class="size-4 shrink-0 {file.frontmatter.icon}"></i>
```

Icons are not rendered on category group headers — only on individual pattern links. The existing `iconMap` in `patterns/index.mdx` is removed in favor of reading icons from each file's frontmatter.

## Files Changed

| File | Change |
|------|--------|
| `www/public/js/demo-sw.js` | New — Service Worker for HTTP and SSE interception, with `skipWaiting()` for immediate updates |
| `www/public/js/demo-shim.js` | New — `server.*` API, route registry, SW communication, WS mock, console logging |
| `www/src/components/Demo.astro` | Update to load `demo-shim.js`, remove `fetch-mock.js` and `_hyperscript` references |
| `www/src/layouts/ContentLayout.astro` | Conditionally render `<Demo />` in `before-content` slot for pattern detail pages |
| `www/src/components/Sidebar.astro` | Add icon rendering for patterns collection |
| `www/src/content/patterns/**/*.md` | Convert to `.mdx`, add `icon` frontmatter, migrate to `server.*` API, remove Jinja remnants |
| `www/src/content/patterns/index.mdx` | Remove `iconMap`, read icons from frontmatter instead |

## Out of Scope

- Demo.astro visual styling/chrome redesign (separate effort)
- Restoring commented-out/broken demo scripts in pattern files
- New pattern content

## Known Limitations

- **WebSocket Network tab:** WS demos use a client-side mock because Service Workers cannot intercept WebSocket upgrades. This is a browser-level limitation that no tool can work around. WS events are logged to the console with styled, labeled output instead.
- **SW fallthrough latency:** Non-demo pages incur a small delay (~300ms) on the first unmatched fetch while the SW waits for a response that never comes. This is negligible in practice but tunable.

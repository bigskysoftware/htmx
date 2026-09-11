# Extensions

## Extensions

Extensions are loaded by including the script file. They apply page-wide automatically:

```html
<script src="/path/to/hx-preload.js"></script>
```

To restrict which extensions can load, use the `extensions` config as a whitelist. The whitelist takes the
registration name, which is not always the file name:

```html
<meta name="htmx-config" content='{"extensions": "preload"}'>
```

Shipped extensions and their registration names:

| File                      | Registers as        | Purpose                                             |
|---------------------------|---------------------|-----------------------------------------------------|
| `hx-multipart.js`         | `hx-multipart`      | Stream HTML with `multipart/mixed`                  |
| `hx-sse.js`               | `sse`               | Stream HTML with `text/event-stream` (SSE)          |
| `hx-ws.js`                | `ws`                | Stream HTML and send data over WebSockets           |
| `hx-browser-indicator.js` | `browser-indicator` | Show the browser tab's own spinner                  |
| `hx-live.js`              | `hx-live`           | DOM-based reactive scripting                        |
| `hx-pending.js`           | `hx-pending`        | Show custom content during requests                 |
| `hx-prompt.js`            | `hx-prompt`         | Restores htmx 2's `hx-prompt`                       |
| `hx-preload.js`           | `preload`           | Preload on hover or other triggers                  |
| `hx-history-cache.js`     | `history-cache`     | Restore back/forward pages from `sessionStorage`    |
| `hx-ptag.js`              | `ptag`              | Skip unchanged polls with `HX-PTag`                 |
| `hx-download.js`          | `download`          | Download files with `hx-swap="download"`            |
| `hx-head.js`              | `hx-head`           | Merge `<head>` tags with `hx-head="merge"`          |
| `hx-targets.js`           | `hx-targets`        | Target many elements with `hx-targets`              |
| `hx-upsert.js`            | `upsert`            | Update or insert elements with `hx-swap="upsert"`   |
| `htmx-2-compat.js`        | `compat`            | Restore htmx 2 defaults and event names             |
| `hx-alpine-compat.js`     | `alpine-compat`     | Run htmx alongside Alpine.js without conflicts      |
| `hx-csp.js`               | `hx-csp`            | Make htmx work under a strict Content Security Policy |

`htmax.js` bundles htmx with the most popular extensions in one file.

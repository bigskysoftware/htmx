---
title: "htmax"
description: "htmx bundled with the most popular extensions in a single file."
---


The `htmax.js` file bundles htmx with the most popular extensions in a single file:

* [`hx-sse`](/extensions/hx-sse)
* [`hx-ws`](/extensions/hx-ws)
* [`hx-preload`](/extensions/hx-preload)
* [`hx-browser-indicator`](/extensions/hx-browser-indicator)
* [`hx-download`](/extensions/hx-download)
* [`hx-pending`](/extensions/hx-pending)
* [`hx-targets`](/extensions/hx-targets)
* [`hx-live`](/extensions/hx-live)
* [`hx-upsert`](/extensions/hx-upsert)
* [`hx-alpine-compat`](/extensions/hx-alpine-compat)
* [`hx-history-cache`](/extensions/hx-history-cache) _(included but disabled by default)_

The extensions are automatically available, you can just use their attributes directly (e.g. `hx-sse:connect`, `hx-ws:connect`).

```html
<script src="/js/htmax.min.js"></script>
```

To enable history caching, opt in via the meta tag:

```html
<meta name="htmx-config" content='{"historyCache": {"disable": false}}'>
```

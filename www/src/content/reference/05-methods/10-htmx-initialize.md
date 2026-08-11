---
title: "htmx.initialize()"
description: "Manually initializes htmx"
---

The `htmx.initialize()` function sets up htmx history handling and processes `document.body`. It is called automatically on `DOMContentLoaded` (or on the next tick if the document is already loaded), but can be called manually when htmx is loaded asynchronously or after a streaming response has delivered the full page.

## Syntax

```javascript
htmx.initialize()
```

## Parameters

None.

## Usage

Call after loading htmx asynchronously to ensure history handling and element initialization run at the right time:

```javascript
import('https://cdn.jsdelivr.net/npm/htmx.org/dist/htmx.min.js').then(() => {
    htmx.initialize();
});
```

Call from a streaming extension after the full page has arrived:

```javascript
// inside an hx-streaming extension handler
htmx.initialize();
```

## Notes

* Safe to call multiple times — history listeners are only registered once
* Equivalent to setting up history handling then calling [`htmx.process(document.body)`](/reference/methods/htmx-process)

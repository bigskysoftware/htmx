---
title: "htmx.config.extensions"
description: "Comma-separated list of extensions to load"
---

Comma-separated list of htmx extensions to automatically load.

**Default:** `""`

## Example

```javascript
htmx.config.extensions = "preload,morph";
```

```html
<meta name="htmx-config" content='{"extensions":"preload,morph"}'>
```

Extensions must be available in the page for this to work.

---
title: "htmx.config.extensions"
description: "Comma-separated list of extensions to load"
---

The `htmx.config.extensions` option accepts a comma-separated list of htmx extensions to automatically load.

**Default:** `""`

## Example

```javascript
htmx.config.extensions = "preload,morph";
```

```html
<meta name="htmx-config" content='{"extensions":"preload,morph"}'>
```

Extensions must be available in the page for this to work.

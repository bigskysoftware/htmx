---
title: "htmx.config.morphIgnore"
description: "Attributes to ignore during morphing"
---

The `htmx.config.morphIgnore` option is an array of attribute names to ignore when morphing DOM elements.

**Default:** `["data-htmx-powered"]`

## Example

```javascript
htmx.config.morphIgnore = ["data-htmx-powered", "data-analytics"];
```

```html
<meta name="htmx-config" content='{"morphIgnore":["data-htmx-powered","data-analytics"]}'>
```

Elements with these attributes won't be updated during morph operations.

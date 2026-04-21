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

These attributes will be skipped during morph and settle operations.

If you use a strict `style-src` CSP, add `"style"` to this list to prevent CSP violations from inline style
attribute copying. See [Security Best Practices](/docs/security/best-practices#csp--inline-styles) for details.

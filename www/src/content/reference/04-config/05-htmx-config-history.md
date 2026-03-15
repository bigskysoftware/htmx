---
title: "htmx.config.history"
description: "Control htmx browser history management"
---

Controls how htmx manages browser history during navigation.

**Default:** `true`

| Value | Behavior |
|-------|----------|
| `true` | htmx pushes URLs into history and restores them on back/forward by fetching the page via `GET` and swapping `innerHTML` on `body`. |
| `false` | htmx does not push URLs into history or intercept back/forward navigation. |
| `"reload"` | htmx pushes URLs into history normally, but on back/forward navigation calls `location.reload()` instead of attempting to restore via ajax. |

## Examples

```javascript
// Disable history entirely
htmx.config.history = false;

// Push URLs, but use full page reload on back/forward
htmx.config.history = "reload";
```

```html
<meta name="htmx-config" content='{"history":false}'>
<meta name="htmx-config" content='{"history":"reload"}'>
```

The `"reload"` option is useful when pages use client-side state (e.g. from hyperscript or Alpine.js) that cannot be reconstructed from a plain `innerHTML` swap.

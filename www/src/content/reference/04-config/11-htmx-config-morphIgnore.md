---
title: "htmx.config.morphIgnore"
description: "Attribute name prefixes to preserve during morphing"
---

The `htmx.config.morphIgnore` option is an array of attribute name prefixes to preserve when morphing DOM elements. An attribute is ignored if its name starts with any entry in the array.

**Default:** `["data-htmx-powered"]`

## Example

```javascript
htmx.config.morphIgnore = ["data-htmx-powered", "data-analytics"];
```

```html
<meta name="htmx-config" content='{"morphIgnore":["data-htmx-powered","data-analytics"]}'>
```

With `"data-"` in the list, all `data-*` attributes are preserved during morph — the server response cannot overwrite them. Exact attribute names also work since a string starts with itself (e.g. `"style"` matches only the `style` attribute).

## Use cases

- Preserve client-side state stored in `data-*` attributes (e.g. from the [`hx-live`](/extensions/hx-live) `data` proxy)
- Prevent CSP violations from inline `style` attribute copying (add `"style"`)
- Protect framework-managed attributes from being overwritten during morph

## See also

- [`morphSkip`](/reference/config/htmx-config-morphSkip) — CSS selector for elements to completely skip during morph
- [`morphSkipChildren`](/reference/config/htmx-config-morphSkipChildren) — CSS selector for elements whose children are preserved

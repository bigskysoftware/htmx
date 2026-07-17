---
title: "htmx.config.morphIgnore"
description: "Preserves attribute prefixes during morphing"
---

The `htmx.config.morphIgnore` option lists attribute prefixes to preserve during morphing.

An attribute is preserved when its name starts with a listed prefix.

**Default:** `["data-htmx-powered"]`

## Example

```javascript
htmx.config.morphIgnore = ["data-htmx-powered", "data-analytics"];
```

```html
<meta name="htmx-config" content='{"morphIgnore":["data-htmx-powered","data-analytics"]}'>
```

Add `"data-"` to preserve every `data-*` attribute.

Exact names also work. For example, `"style"` preserves only the `style` attribute.

## Use Cases

- Preserve client-side state stored in `data-*` attributes (e.g. from the [`hx-live`](/extensions/hx-live) `data` proxy)
- Prevent CSP violations from inline `style` attribute copying (add `"style"`)
- Protect framework-managed attributes from being overwritten during morph

## See Also

- [`morphSkip`](/reference/config/htmx-config-morphSkip) — CSS selector for elements to completely skip during morph
- [`morphSkipChildren`](/reference/config/htmx-config-morphSkipChildren) — CSS selector for elements whose children are preserved

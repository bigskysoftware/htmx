---
title: "htmx.config.morphPreserve"
description: "CSS selector for elements morph skips entirely"
---

The `htmx.config.morphPreserve` option preserves matching elements entirely during morph (both attributes and children).

**Default:** `null`

## Example

```javascript
htmx.config.morphPreserve = ".chart, .map, .editor";
```

```html
<meta name="htmx-config" content="morphPreserve: '.chart, .map, .editor'">
```

Comma-joined selectors all match (standard CSS).

## See also

- [`morphPreserveChildrenOf`](/reference/config/htmx-config-morphPreserveChildrenOf), preserve only the children list (attrs still change)
- [`morphPreserveAttributes`](/reference/config/htmx-config-morphPreserveAttributes), preserve specific attribute names
- [`hx-preserve`](/reference/attributes/hx-preserve), per-element preservation across all swap types

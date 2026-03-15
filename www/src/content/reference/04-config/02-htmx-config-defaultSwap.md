---
title: "htmx.config.defaultSwap"
description: "Default swap style for responses"
---

The `htmx.config.defaultSwap` option sets the default swap style when [`hx-swap`](/reference/attributes/hx-swap) is not specified.

**Default:** `"innerHTML"`

## Valid Values

- `"innerHTML"` - Replace inner content
- `"outerHTML"` - Replace entire element
- `"beforebegin"` - Insert before element
- `"afterbegin"` - Insert as first child
- `"beforeend"` - Insert as last child
- `"afterend"` - Insert after element
- `"delete"` - Delete the target element
- `"none"` - Don't swap content

## Example

```javascript
htmx.config.defaultSwap = "outerHTML";
```

```html
<meta name="htmx-config" content='{"defaultSwap":"outerHTML"}'>
```

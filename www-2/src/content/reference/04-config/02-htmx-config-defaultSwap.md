---
title: "htmx.config.defaultSwap"
description: "Default swap method for responses"
---

Sets the default swap method when `hx-swap` is not specified.

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

---
title: "htmx.config.defaultSwapEmpty"
description: "Whether to skip swaps when the response body is empty"
---

The `htmx.config.defaultSwapEmpty` option controls whether htmx skips the swap when the server returns an empty response body.

**Default:** `false`

## Values

- `false` — proceed with the swap even when the response is empty (default)
- `true` — skip the swap when the response is empty

## Example

```javascript
htmx.config.defaultSwapEmpty = true;
```

```html
<meta name="htmx-config" content='{"defaultSwapEmpty":true}'>
```

Override per element with the [`empty`](/reference/attributes/hx-swap#empty) modifier on `hx-swap`:

```html
<!-- skip swap on empty response for this element only -->
<div hx-swap="innerHTML empty"></div>

<!-- always proceed, regardless of global default -->
<div hx-swap="innerHTML empty:false"></div>
```

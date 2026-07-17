---
title: "htmx.config.defaultSwapEmpty"
description: "Controls main swap when response body is empty"
---

The `htmx.config.defaultSwapEmpty` option controls the main swap when the response body is empty.

Override it per element with [`swapEmpty`](/reference/attributes/hx-swap#swapempty).

**Default:** unset. When unset, htmx performs the main swap on an empty response except when the response contained only `<hx-partial>` elements.

## Values

- `true` — perform the main swap on an empty response (clears the target)
- `false` — skip the main swap on an empty response (leaves the target unchanged)

## Example

```javascript
htmx.config.defaultSwapEmpty = false;
```

```html
<meta name="htmx-config" content='{"defaultSwapEmpty":false}'>
```

Override per element with the [`swapEmpty`](/reference/attributes/hx-swap#swapempty) modifier on `hx-swap`:

```html
<!-- skip the main swap on an empty response for this element only -->
<div hx-swap="innerHTML swapEmpty:false"></div>

<!-- force the main swap even on an empty response -->
<div hx-swap="innerHTML swapEmpty:true"></div>
```

---
title: "htmx.config.defaultSwapEmpty"
description: "Whether an empty response body performs the main swap"
---

The `htmx.config.defaultSwapEmpty` option sets the default for whether htmx performs the main swap when the server returns an empty response body. It can be overridden per element with the [`swapEmpty`](/reference/attributes/hx-swap#swapempty) modifier on `hx-swap`.

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

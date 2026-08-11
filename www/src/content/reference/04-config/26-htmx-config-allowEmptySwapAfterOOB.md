---
title: "htmx.config.allowEmptySwapAfterOOB"
description: "Controls whether OOB swaps prevent empty main swaps"
---

The `htmx.config.allowEmptySwapAfterOOB` option controls whether out-of-band swaps prevent the main swap when the response body is empty after OOB extraction.

Override it per element with [`swapEmpty`](/reference/attributes/hx-swap#swapempty).

**Default:** `false`. When `false`, OOB swaps prevent the empty main swap. When `true`, the main swap runs even if only OOB elements were in the response.

Note: [`<hx-partial>`](/reference/tags/hx-partial) elements always prevent empty main swaps regardless of this setting. Partials are designed as true response separators where the server has explicit control.

## Values

- `false` — OOB swaps prevent the empty main swap (default)
- `true` — allow the main swap even after OOB extraction leaves no content

## Example

```javascript
htmx.config.allowEmptySwapAfterOOB = true;
```

```html
<meta name="htmx-config" content='{"allowEmptySwapAfterOOB":true}'>
```

Override per element with the [`swapEmpty`](/reference/attributes/hx-swap#swapempty) modifier on `hx-swap`:

```html
<!-- skip the main swap on an empty response for this element only -->
<div hx-swap="innerHTML swapEmpty:false"></div>

<!-- force the main swap even on an empty response -->
<div hx-swap="innerHTML swapEmpty:true"></div>
```

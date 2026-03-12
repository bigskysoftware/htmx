---
title: "htmx.swap()"
description: "Perform an HTML content swap into the DOM"
---

The `htmx.swap()` function performs swapping of HTML content into the DOM. This is primarily an internal method used by htmx and extension developers.

For most use cases, prefer [`htmx.ajax()`](/reference/methods/htmx-ajax) which handles the complete request lifecycle.

## Syntax

```javascript
htmx.swap(ctx)
```

## Parameters

- `ctx` - A context object with the following properties:
  - `text` (required) — the HTML content to swap as a string
  - `target` — the target element to swap into (defaults to `document.body`)
  - `swap` — swap style string (e.g. `'innerHTML'`, `'outerHTML'`)
  - `select` — CSS selector to extract content from the response
  - `selectOOB` — selector for out-of-band swaps
  - `sourceElement` — the element that triggered the swap
  - `transition` — boolean, whether to use view transitions

## Example

```javascript
htmx.swap({
  text: "<div>Swapped!</div>",
  target: document.querySelector("#output"),
  swap: 'innerHTML'
});
```

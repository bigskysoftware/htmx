---
title: "hx-select-oob"
description: "Picks response elements to swap into page by ID"
---

The `hx-select-oob` attribute selects response elements to swap outside the main target.

Use it to update multiple page elements from one response.

## Syntax

Set a comma-separated list of CSS selectors. Add `:SWAP` to override a selector's swap strategy.

```html
<button hx-get="/example" hx-select-oob="#alert,#sidebar:afterbegin">
  Click Me
</button>
```


```html
<button hx-get="/update" hx-select-oob="#notification">
  Update
</button>

<!-- Response would contain: -->
<!-- <div id="notification">New notification!</div> -->
```

htmx swaps the response's `#notification` into the existing element with the same ID.

## With Swap Strategies

You can specify different swap strategies for each selected element:

```html
<button hx-get="/update"
        hx-select-oob="#alert:afterbegin,#count:innerHTML">
  Update Multiple
</button>
```

## Notes

* Works similarly to `hx-swap-oob` in the response, but driven from the request side
* The selected elements must have an `id` attribute to identify where to swap them
* If no swap strategy is specified, the default is `outerHTML`
* Can be combined with [`hx-select`](/reference/attributes/hx-select) to also select the main content

## See Also

* [`hx-swap-oob`](/reference/attributes/hx-swap-oob)
* [`hx-select`](/reference/attributes/hx-select)
* [`<hx-partial>`](/docs#partials-hx-partial)

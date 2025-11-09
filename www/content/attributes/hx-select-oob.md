+++
title = "hx-select-oob"
+++

The `hx-select-oob` attribute allows you to select content from a response to be swapped in via an out-of-band (OOB) swap, separate from the main content swap.

This is useful when you want to update multiple parts of the page from a single response, where some updates happen in the target element and others happen in different locations.

## Syntax

The value is a comma-separated list of CSS selectors. Each selector can optionally be followed by a colon and a swap strategy.

```html
<button hx-get="/example" hx-select-oob="#alert,#sidebar:afterbegin">
  Click Me
</button>
```

## Basic Usage

```html
<button hx-get="/update" hx-select-oob="#notification">
  Update
</button>

<!-- Response would contain: -->
<!-- <div id="notification">New notification!</div> -->
```

The element with id `notification` in the response will be swapped into the page at the location of the existing element with that id.

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
* Can be combined with `hx-select` to also select the main content

## See Also

* [`hx-swap-oob`](@/attributes/hx-swap-oob.md)
* [`hx-select`](@/attributes/hx-select.md)
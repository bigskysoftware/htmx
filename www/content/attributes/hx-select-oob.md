+++
title = "hx-select-oob"
+++

The `hx-select-oob` attribute allows you to select content from a response to be swapped in via an "out of band" swap.
The value of this attribute is a comma separated list of elements to swap in. This attribute is almost
always paired with [hx-select](@/attributes/hx-select.md).

Here is an example that selects a subset of the response content:

```html
<div>
   <div id="alert"></div>
    <button hx-get="/info" 
            hx-select="#info-details" 
            hx-swap="outerHTML"
            hx-select-oob="#alert">
        Get Info!
    </button>
</div>
```

This button will issue a `GET` to `/info` and then select the element with the id `info-details`,
which will replace the entire button in the DOM, and, in addition, pick out an element with the id `alert` 
in the response and swap it in for div in the DOM with the same ID.

Each value in the comma separated list of values can specify any valid [`hx-swap`](@/attributes/hx-swap.md)
strategy by separating the selector and the swap strategy with a `:`.

For example, to prepend the alert content instead of replacing it:

```html
<div>
   <div id="alert"></div>
    <button hx-get="/info"
            hx-select="#info-details"
            hx-swap="outerHTML"
            hx-select-oob="#alert:afterbegin">
        Get Info!
    </button>
</div>
```

## Notes

* `hx-select-oob` is inherited and can be placed on a parent element

+++
title = "hx-target"
+++

The `hx-target` attribute allows you to target a different element for swapping than the one issuing the AJAX
request.

The value of this attribute is an extended CSS selector that matches the element to be swapped.
See [Extended CSS Syntax](@/extended-css.md) for more details.

Here is an example that targets a div:

```html
<div>
    <div id="response-div"></div>
    <button hx-post="/register" hx-target="#response-div" hx-swap="beforeend">
        Register!
    </button>
</div>
```

The response from the `/register` url will be appended to the `div` with the id `response-div`.

This example uses `hx-target="this"` to make a link that updates itself when clicked:
```html
<a hx-post="/new-link" hx-target="this" hx-swap="outerHTML">New link</a>
```

## Notes

* `hx-target` is inherited and can be placed on a parent element

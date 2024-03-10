+++
title = "hx-swap-oob"
+++

The `hx-swap-oob` attribute allows you to mark an element to swap in from a response via an "out of band" swap.
This allows you to piggy back updates to other elements during a response.

Consider the following response HTML: 

```html
<div>
 ...
</div>
<div id="alerts" hx-swap-oob="true">
    Saved!
</div>

```

The first div will be swapped into the target the usual manner.  The second div, however, will be swapped in as a replacement for the element with the id `alerts`, and will not end up in the target.

The value of the `hx-swap-oob` can be:

* `true`
* any valid [`hx-swap`](@/attributes/hx-swap.md) value
* any valid [`hx-swap`](@/attributes/hx-swap.md) value, followed by a colon, followed by a CSS selector

If the value is `true` or `outerHTML` (which are equivalent) the element will be swapped inline.  

If a swap value is given, that swap strategy will be used.

If a selector is given, all elements matched by that selector will be swapped.  If not, the element with an ID matching the new content will be swapped.

## Notes

* `hx-swap-oob` is not inherited

+++
title = "hx-swap-oob"
+++

The `hx-swap-oob` attribute allows you to specify that some content in a response should be
swapped into the DOM somewhere other than the target, that is "Out of Band".  This allows you to piggy back updates to other element updates on a response.

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

### Troublesome Tables

Note that you can use a `template` tag to encapsulate types of elements that, by the HTML spec, can't stand on their own in the
DOM (`<tr>`, `<td>`, `<th>`, `<thead>`, `<tbody>`, `<tfoot>`, `<colgroup>`, `<caption>` & `<col>`).

Here is an example with an out of band swap of a table row being encapsulated in this way:

```html
<div>
    ...
</div>
<template>
    <tr id="row" hx-swap-oob="true">
        ...
    </tr>
</template>
```

Note that these template tags will be removed from the final content of the page.

## Nested OOB Swaps

By default, any element with `hx-swap-oob=` attribute anywhere in the response is processed for oob swap behavior, including when an element is nested within the main response element.
This can be problematic when using [template fragments](https://htmx.org/essays/template-fragments/) where a fragment may be reused as a oob-swap target and also as part of a bigger fragment. When the bigger fragment is the main response the inner fragment will still be processed as an oob swap, removing it from the dom.

This behavior can be changed by setting the config `htmx.config.allowNestedOobSwaps` to `false`. If this config option is `false`, OOB swaps are only processed when the element is *adjacent to* the main response element, OOB swaps elsewhere will be ignored and oob-swap-related attributes stripped.

## Notes

* `hx-swap-oob` is not inherited

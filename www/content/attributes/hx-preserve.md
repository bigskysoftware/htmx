+++
title = "hx-preserve"
+++

The `hx-preserve` attribute allows you to keep an element unchanged during HTML replacement.
Elements with `hx-preserve` set are preserved by `id` when htmx updates any ancestor element.
You *must* set an unchanging `id` on elements for `hx-preserve` to work.
The response requires an element with the same `id`, but its type and other attributes are ignored.

Note that some elements cannot unfortunately be preserved properly, such as `<input type="text">` (focus and caret position are lost), iframes or certain types of videos. To tackle some of these cases we recommend the [morphdom extension](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/morphdom-swap/README.md), which does a more elaborate DOM
reconciliation.

## OOB Swap Usage

You can include `hx-preserve` in the inner response of a [hx-swap-oob](@/attributes/hx-swap-oob.md) and it will preserve the element unchanged during the out of band partial replacement as well. However, you cannot place `hx-preserve` on the same element as the `hx-swap-oob` is placed. For example, here is an oob response that replaces notify but leaves the retain div unchanged.

```html
<div id="notify" hx-swap-oob="true">
    <p>The below content will not be changed</p>
    <div id="retain" hx-preserve>Use the on-page contents</div>
</div>
```

## Notes

* `hx-preserve` is not inherited
* `hx-preserve` can cause elements to be relocated to a new location when swapping in a partial response

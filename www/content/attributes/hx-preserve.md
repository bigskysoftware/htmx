+++
title = "hx-preserve"
description = """\
  The hx-preserve attribute in htmx allows you to keep an element unchanged during HTML replacement. Elements with \
  hx-preserve set are preserved by `id` when htmx updates any ancestor element."""
+++

The `hx-preserve` attribute allows you to keep an element unchanged during HTML replacement.
Elements with `hx-preserve` set are preserved by `id` when htmx updates any ancestor element.
You *must* set an unchanging `id` on elements for `hx-preserve` to work.
The response requires an element with the same `id`, but its type and other attributes are ignored.

## Notes

* `hx-preserve` is not inherited
* You can use `hx-preserve="true"` or use it as a boolean attribute with just `hx-preserve`
* Some elements cannot unfortunately be preserved properly, such as `<input type="text">` (focus and caret position are lost), iframes or certain types of videos. To tackle some of these cases we recommend the [morphdom extension](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/morphdom-swap/README.md), which does a more elaborate DOM
reconciliation
* When using [History Support](@/docs.md#history) for actions like the back button `hx-preserve` elements will also have their state preserved
* Avoid using [hx-swap](@/attributes/hx-swap.md) set to `none` with requests that could contain a `hx-preserve` element to avoid losing it
* `hx-preserve` can cause elements to be removed from their current location and relocated to a new location when swapping in a partial/oob response
  ```html
  <div id="new_location">
    Just relocated the video here
    <div id="video" hx-preserve></div>
  </div>
  ```
* Can be used on the inside content of a [hx-swap-oob](@/attributes/hx-swap-oob.md) element
  ```html
  <div id="notify" hx-swap-oob="true">
    Notification updated but keep the same retain
    <div id="retain" hx-preserve></div>
  </div>
  ```

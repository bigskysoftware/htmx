---
title: "hx-preserve"
description: "Preserves element during swaps"
---

The `hx-preserve` attribute keeps an element unchanged when an ancestor is replaced.

Preserved elements match by `id`. Use a stable `id`, and include the same `id` in the response.

Response element type and other attributes are ignored.

## Syntax

```html
<div id="video-player" hx-preserve="true">...</div>
```

## Notes

* You can use `hx-preserve="true"` or use it as a boolean attribute with just `hx-preserve`
* Some elements cannot unfortunately be preserved properly, such as `<input type="text">` (focus and caret position are
  lost), iframes or certain types of videos. To tackle some of these cases we recommend
  the [morphdom extension](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/morphdom-swap/README), which
  does a more elaborate DOM
  reconciliation
* When using [History Support](/docs#history) for actions like the back button `hx-preserve` elements will also have
  their state preserved
* Avoid using [`hx-swap`](/reference/attributes/hx-swap) set to `none` with requests that could contain a `hx-preserve` element to
  avoid losing it
* `hx-preserve` can cause elements to be removed from their current location and relocated to a new location when
  swapping in a partial/oob response
  ```html
  <div id="new_location">
    Just relocated the video here
    <div id="video" hx-preserve></div>
  </div>
  ```
* Can be used on the inside content of a [`hx-swap-oob`](/reference/attributes/hx-swap-oob) element
  ```html
  <div id="notify" hx-swap-oob="true">
    Notification updated but keep the same retain
    <div id="retain" hx-preserve></div>
  </div>
  ```
* Works with morph swaps (`innerMorph`/`outerMorph`). When the server response includes an element with `hx-preserve`,
  htmx stashes the live element before morphing and restores it afterward. The `id` is required for morph the same as
  for other swap styles. Note that morph already natively preserves element identity for elements with matching `id`s.
  DOM state, focus, and scroll position are maintained without `hx-preserve`. To prevent server updates from changing
  an element or its children entirely, use [`hx-morph-skip`](/reference/config/htmx-config-morphSkip) or
  [`hx-morph-skip-children`](/reference/config/htmx-config-morphSkipChildren) in your server templates. These work
  similarly to `hx-preserve` but are morph-specific and don't always require an `id`.

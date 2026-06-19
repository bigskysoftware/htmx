---
title: "hx-preserve"
description: "Preserves the element during swaps"
---

The `hx-preserve` attribute allows you to keep an element unchanged during HTML replacement.
Elements with `hx-preserve` set are preserved by `id` when htmx updates any ancestor element.
You *must* set an unchanging `id` on elements for `hx-preserve` to work.
The response requires an element with the same `id`, but its type and other attributes are ignored.

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

## Morph modifiers

During morph swaps, put `hx-preserve` on any element to keep it as-is:

```html
<div hx-preserve>Untouched by morph.</div>
```

> Unlike non-morph swaps, no `id` is required during morph.

Two narrower per-element modifiers are also available:

### `hx-preserve:children`

*Applies during [`innerMorph`](/reference/attributes/hx-swap#innermorph) and [`outerMorph`](/reference/attributes/hx-swap#outermorph) only.*

Children preserved, while the element's own attributes still change.

```html
<!-- DOM -->
<lit-component value="old" hx-preserve:children>
  <div>state set by JS</div>
</lit-component>

<!-- Response -->
<lit-component value="new">
  <div>ignored</div>
</lit-component>

<!-- After morph -->
<lit-component value="new" hx-preserve:children>
  <div>state set by JS</div>
</lit-component>
```

Useful for web components, jQuery plugins (Select2, Sortable.js), canvas-based libraries (Chart.js, Leaflet), and anything whose children are managed outside the server response.

Equivalent to the global [`morphPreserveChildrenOf`](/reference/config/htmx-config-morphPreserveChildrenOf) config, scoped to one element.

### `hx-preserve:attributes`

*Applies during [`innerMorph`](/reference/attributes/hx-swap#innermorph), [`outerMorph`](/reference/attributes/hx-swap#outermorph), and [`outerSync`](/reference/attributes/hx-swap#outersync).*

Listed attributes preserved, while everything else on the element still changes.

```html
<!-- DOM -->
<input name="q" value="user typed this" hx-preserve:attributes="value">

<!-- Response -->
<input name="q" value="server default">

<!-- After morph -->
<input name="q" value="user typed this" hx-preserve:attributes="value">
```

Accepts a comma- or whitespace-separated list. Patterns support `*` wildcard and `(a|b)` alternation, same as the global [`morphPreserveAttributes`](/reference/config/htmx-config-morphPreserveAttributes) config:

```html
<lit-component hx-preserve:attributes="state, data-internal-*, aria-(label|hidden)">
```

Per-element patterns compose with the global config: the union of both lists is preserved.

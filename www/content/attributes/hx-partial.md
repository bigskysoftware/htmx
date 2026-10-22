+++
title = "hx-partial"
description = """
  hx-partial is a server-sent swap command. The server wraps content in <hx-partial hx-target="..."> \
  tags in its response; htmx reads the targeting instructions, performs the swap, and discards the \
  envelope — it is never inserted into the DOM."""
+++

`<hx-partial>` is a **server-sent swap command**, not a DOM element. It exists only in the HTTP
response body. The server wraps content in `<hx-partial hx-target="...">` tags to tell htmx
where to swap that content; htmx reads the instructions, performs the swap, and discards the
envelope entirely — nothing from the `<hx-partial>` tag itself ever appears in the page.

This is similar to [`hx-swap-oob`](@/attributes/hx-swap-oob.md) but with key differences:
the envelope is always consumed and discarded, targets are resolved relative to the **triggering
element** using the full htmx extended selector vocabulary, and partials execute **before** the
main swap.

## Basic usage

A response can contain any number of `<hx-partial>` elements alongside (or instead of) the
main response content:

```html
<div>Updated main content</div>

<hx-partial hx-target="#notifications">
  3 new messages
</hx-partial>

<hx-partial hx-target="#user-status" hx-swap="outerHTML">
  <span id="user-status" class="online">Online</span>
</hx-partial>
```

The first `<hx-partial>` replaces the `innerHTML` of `#notifications`. The second replaces
the entire `#user-status` element using `outerHTML`. The `<div>` is swapped into the main
request target as normal.

## id shorthand

If you give the `<hx-partial>` an `id` attribute and omit `hx-target`, htmx uses `#<id>` as
the target selector:

```html
<hx-partial id="alerts">
  Saved successfully!
</hx-partial>
```

This is equivalent to `<hx-partial hx-target="#alerts">`.

## Controlling the swap style

The `hx-swap` attribute on `<hx-partial>` accepts all the same values as
[`hx-swap`](@/attributes/hx-swap.md) on a normal element. The default is `innerHTML`.

```html
<hx-partial hx-target="#feed" hx-swap="beforeend">
  <li>New item</li>
</hx-partial>
```

## Extended selectors

`hx-target` on a partial is resolved relative to the **triggering element**, so you can use
the full htmx extended selector vocabulary:

```html
<hx-partial hx-target="closest tr">
  <td>Updated</td><td>values</td>
</hx-partial>

<hx-partial hx-target="find .status">
  Active
</hx-partial>
```

See [`hx-target`](@/attributes/hx-target.md) for the full list of extended selectors
(`closest`, `find`, `next`, `previous`, etc.).

## Multiple partials

Any number of `<hx-partial>` elements may appear in a single response. They are processed in
document order, all before the main swap.

```html
<hx-partial hx-target="#cart-count">2</hx-partial>
<hx-partial hx-target="#cart-total">$19.98</hx-partial>
<hx-partial hx-target="#last-added" hx-swap="afterbegin">
  <li>Widget</li>
</hx-partial>
```

## Partials-only response

If the response contains **only** `<hx-partial>` elements (no other content), the main swap
is suppressed and the original target is left unchanged. This lets the server update
arbitrary parts of the page without touching the element that triggered the request.

```html
<!-- entire response — main target is not modified -->
<hx-partial hx-target="#status">Done</hx-partial>
<hx-partial hx-target="#count">42</hx-partial>
```

## Template fallback form

If a partial response is accidentally rendered as a full page — for example during
development or due to a server misconfiguration — raw `<hx-partial>` tags will appear
as visible text in the browser. The `<template hx type="partial">` form avoids this:
browsers treat `<template>` as inert and render nothing, so the page stays blank rather
than leaking raw swap commands.

```html
<template hx type="partial" hx-target="#alerts">
  Saved!
</template>
```

Both forms behave identically when processed by htmx.

## Troublesome tables and lists

Before the response is parsed, htmx converts `<hx-partial>` tags into `<template>` elements.
Because the content lives inside `template.content`, it is parsed in a fragment context and
survives intact — `<tr>`, `<td>`, `<li>` and similar elements are preserved regardless of
where the `<hx-partial>` appears in the response.

```html
<hx-partial hx-target="#row-3" hx-swap="outerHTML">
  <tr id="row-3"><td>Updated</td></tr>
</hx-partial>
```

If your template engine requires strictly valid HTML and rejects unknown tags, use the
template fallback form with the appropriate wrapper so the parser sees valid content:

```html
<template hx type="partial" hx-target="find tbody" hx-swap="beforeend">
  <table><tbody><tr><td>New row</td></tr></tbody></table>
</template>
```

## Comparison with hx-swap-oob

| | `hx-swap-oob` | `<hx-partial>` |
|---|---|---|
| Placed on | the content element itself | a wrapper element (always stripped) |
| Target resolution | by `id` match or CSS selector | htmx extended selectors, relative to triggering element |
| Execution order | before main swap | before main swap |
| Template engine safe form | `<template>` wrapper | `<template hx type="partial">` |
| Cancellable via event | `htmx:oobBeforeSwap` | `htmx:partialBeforeSwap` |

## Events

* [`htmx:partialBeforeSwap`](@/events.md#htmx:partialBeforeSwap) — fired before each partial swap; cancellable, allows re-targeting and fragment rewriting
* [`htmx:partialAfterSwap`](@/events.md#htmx:partialAfterSwap) — fired after each partial swap
* [`htmx:partialErrorNoTarget`](@/events.md#htmx:partialErrorNoTarget) — fired on `document.body` when no element matches the target selector
* [`htmx:processTemplate`](@/events.md#htmx:processTemplate) — fired for any other `<hx-*>` tag type (e.g. `<hx-toast>`), allowing custom handling

## Notes

* `<hx-partial>` attributes are not inherited
* Partials with no matching target are silently ignored (see `htmx:partialErrorNoTarget`)
* `hx-swap-oob` and `<hx-partial>` can coexist in the same response without interfering

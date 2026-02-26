+++
title = "htmx Idiomorph Extension"
+++

[Idiomorph](https://github.com/bigskysoftware/idiomorph) is a DOM morphing algorithm created by the htmx creator. DOM
morphing is a process where an existing DOM tree is "morphed" into the shape of another in a way that resuses as much of
the existing DOM's nodes as possible. By preserving nodes when changing from one tree to another you can present a
much smoother transition between the two states.

You can use the idiomorph morphing algorithm as a [swapping](@attributes/hx-swap) strategy by including the idiomorph
extension.

## Installing

Include the idiomorph extension after htmx:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/idiomorph-ext.js"></script>
```

## Usage

Once you have included the idiomorph extension, you can use `morph`, `morph:outerHTML` or `morph:innerHTML` as swap strategies.

- `morph` & `morph:outerHTML` will morph the target element as well as it's children
- `morph:innerHTML` will morph only the inner children of an element, leaving the target untouched

```html
<button hx-get="/example" hx-swap="morph">
  Morph My Outer HTML
</button>

<button hx-get="/example" hx-swap="morph:outerHTML">
  Morph My Outer HTML
</button>

<button hx-get="/example" hx-swap="morph:innerHTML">
  Morph My Inner HTML
</button>
```

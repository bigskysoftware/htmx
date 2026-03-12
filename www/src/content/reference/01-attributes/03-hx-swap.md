---
title: "hx-swap"
description: "Specify the method for swap"
---

The `hx-swap` attribute controls where the response content goes.

Defaults to `innerHTML` (configurable via [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap))

## Examples

```html
<!-- Replace content in container -->
<div hx-get="/content" hx-swap="innerHTML"></div>

<!-- Append to list and scroll down -->
<div hx-get="/items" hx-swap="beforeend scroll:bottom"></div>

<!-- Update form with smooth transition -->
<form hx-post="/submit" hx-swap="outerHTML transition:true"></form>
```

## Swap Methods

### `innerHTML`

Replaces content inside element.

```html
<div hx-get="..." hx-swap="innerHTML">
  ... <!-- This gets replaced -->
</div>
```

### `outerHTML`

Replaces entire element.

```html
<!-- This... -->
<div hx-get="..." hx-swap="outerHTML">
  ...
</div>
<!-- ...gets replaced -->
```

### `textContent`

Replaces the text content of the element, without parsing the response as HTML.

Useful when the response is plain text and you want to avoid any HTML injection.

```html
<span hx-get="/count" hx-swap="textContent">0</span>
```

### `beforebegin` / `before`

Inserts content before element.

```html
<!-- Response goes here -->
<div hx-get="..." hx-swap="beforebegin">
  ...
</div>
```

*Can also use `hx-swap="before"`*

### `afterbegin` / `prepend`

Inserts content as first child.

```html
<div hx-get="..." hx-swap="afterbegin">
  <!-- Response goes here -->
  ...
</div>
```

*Can also use `hx-swap="prepend"`*

### `beforeend` / `append`

Inserts content as last child.

```html
<div hx-get="..." hx-swap="beforeend">
  ...
  <!-- Response goes here -->
</div>
```

*Can also use `hx-swap="append"`*

### `afterend` / `after`

Inserts content after element.

```html
<div hx-get="..." hx-swap="afterend">
  ...
</div>
<!-- Response goes here -->
```

*Can also use `hx-swap="after"`*

### `innerMorph`

Morphs content inside element, preserving state and focus.

*Uses the [idiomorph](https://github.com/bigskysoftware/idiomorph) algorithm.*

```html
<div hx-get="..." hx-swap="innerMorph">
  ... <!-- This gets morphed -->
</div>
```

### `outerMorph`

Morphs entire element, preserving state and focus.

*Uses the [idiomorph](https://github.com/bigskysoftware/idiomorph) algorithm.*

```html
<!-- This... -->
<div hx-get="..." hx-swap="outerMorph">
  ...
</div>
<!-- ...gets morphed -->
```

**Morph exclusions:**

Exclude specific elements from morphing:
- [`htmx.config.morphSkip`](/reference/config/htmx-config-morphskip) - Skip entire elements
- [`htmx.config.morphSkipChildren`](/reference/config/htmx-config-morphskipchildren) - Skip children only

### `delete`

Removes element (ignores response content).

```html
<!-- This... -->
<div hx-delete="/resource/123" hx-swap="delete">
  ...
</div>
<!-- ...is removed -->
```

### `none`

Doesn't insert content (out-of-band swaps still work).

```html
<div hx-get="/trigger-side-effects" hx-swap="none">
  <!-- Response not inserted, but OOB swaps happen -->
</div>
```

### `upsert`

Updates existing elements by ID and inserts new ones.

*Requires the [upsert extension](https://github.com/bigskysoftware/htmx-extensions).*

```html
<div hx-get="/items" hx-swap="upsert">
  <!-- Existing elements with matching IDs are updated, new ones are inserted -->
</div>
```

## Modifiers

Customize swap behavior with modifiers.

### `transition`

Enables View Transitions API for smooth page transitions.

```html
<div hx-swap="innerHTML transition:true"></div>
```

Enable globally: [`htmx.config.transitions = true`](/reference/config/htmx-config-transitions)

### `swap`

Adds delay before swap.

Useful for showing loading states or coordinating with CSS animations.

```html
<div hx-swap="innerHTML swap:1s"></div>
```

Default: `0ms`

### `settle`

Adds delay between the swap and the settle phase.

Useful for synchronizing htmx with CSS transition timing.

```html
<div hx-swap="innerHTML settle:200ms"></div>
```

Default: `1ms`

### `ignoreTitle`

Prevents updating the page `<title>`.

By default, htmx updates the page title from `<title>` tags in responses.

```html
<div hx-swap="innerHTML ignoreTitle:true"></div>
```

### `scroll`

Auto-scroll to swapped content. 

Useful for infinite scroll, chat messages, or focusing attention on new content.

```html
<div hx-swap="beforeend scroll:bottom"></div>
```

Values: `top`, `bottom`

Target a different element:

```html
<div hx-swap="innerHTML scroll:#other:top"></div>
```

Scroll the window:

```html
<div hx-swap="innerHTML scroll:window:top"></div>
```

### `show`

Scrolls to show the target element in viewport.

Values: `top`, `bottom`, `none`

```html
<div hx-swap="innerHTML show:top"></div>
```

Show a different element:

```html
<div hx-swap="innerHTML show:#other:top"></div>
```

Boosted forms default to `show:top`. Disable:

```html
<form hx-swap="show:none"></form>
```

### `target`

Override swap target inline. Alternative to using [`hx-target`](/reference/attributes/hx-target) attribute.

```html
<div hx-swap="innerHTML target:#results"></div>
```

### `strip`

Controls whether the outer element of the response content is removed before swapping.

```html
<div hx-swap="innerHTML strip:true"></div>
```

## Caveats

* Due to DOM limitations, it's not possible to use the `outerHTML` method on the `<body>` element.
  htmx will change `outerHTML` on `<body>` to use `innerHTML`.

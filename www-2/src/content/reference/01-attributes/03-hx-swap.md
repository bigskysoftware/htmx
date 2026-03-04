---
title: "hx-swap"
description: "Specify the method for swap"
---

# hx-swap

Controls where the response content goes.

Defaults to `innerHTML` (configurable via [`htmx.config.defaultSwapStyle`](/reference/javascript-api/htmx-config-defaultSwap))

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
- [`htmx.config.morphSkip`](/reference/javascript-api/htmx-config-morphskip) - Skip entire elements
- [`htmx.config.morphSkipChildren`](/reference/javascript-api/htmx-config-morphskipchildren) - Skip children only

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

## Modifiers

Customize swap behavior with modifiers.

### `transition`

Enables View Transitions API for smooth page transitions.

```html
<div hx-swap="innerHTML transition:true"></div>
```

Enable globally: [`htmx.config.transitions = true`](/reference/javascript-api/htmx-config-transitions)

### `swap`

Adds delay before swap.

Useful for showing loading states or coordinating with CSS animations.

```html
<div hx-swap="innerHTML swap:1s"></div>
```

Default: `0ms`

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

Override swap target inline. Alternative to using `hx-target` attribute.

```html
<div hx-swap="innerHTML target:#results"></div>
```

## Caveats

* Due to DOM limitations, it's not possible to use the `outerHTML` method on the `<body>` element.
  htmx will change `outerHTML` on `<body>` to use `innerHTML`.

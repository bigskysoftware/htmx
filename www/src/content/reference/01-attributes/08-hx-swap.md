---
title: "hx-swap"
description: "Controls how response is inserted"
---

The `hx-swap` attribute controls where the response content goes.

Defaults to `innerHTML` (configurable via [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap))

## Example

```html
<!-- Replace content in container -->
<div hx-get="..." hx-swap="innerHTML"></div>

<!-- Append to list and scroll down -->
<div hx-get="..." hx-swap="beforeend scroll:bottom"></div>

<!-- Update form with smooth transition -->
<form hx-post="..." hx-swap="outerHTML transition:true"></form>
```

## Swap Methods

### `innerHTML`

Replaces content inside element.

```html
<div hx-get="..." hx-swap="innerHTML">
  <!-- This... -->
  ...
  <!-- ...gets replaced -->
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

```html
<span hx-get="..." hx-swap="textContent">0</span>
```

Useful for plain text responses without HTML injection.

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

```html
<div hx-get="..." hx-swap="innerMorph">
  ... <!-- This gets morphed -->
</div>
```

### `outerMorph`

Morphs entire element, preserving state and focus.

```html
<!-- This... -->
<div hx-get="..." hx-swap="outerMorph">
  ...
</div>
<!-- ...gets morphed -->
```

Skip morphing with:

- [`hx-morph-skip`](/reference/attributes/hx-morph-skip): attributes and children
- [`hx-morph-skip-children`](/reference/attributes/hx-morph-skip-children): children only; attributes still morph

Global selectors: [`htmx.config.morphSkip`](/reference/config/htmx-config-morphSkip) / [`htmx.config.morphSkipChildren`](/reference/config/htmx-config-morphSkipChildren)

### `outerSync`

Morphs the target's attributes, then replaces its children.

```html
<!-- These attributes... -->
<section id="main" hx-get="..." hx-swap="outerSync">
  <!-- ...are morphed -->

  <!-- These children... -->
  ...
  <!-- ...are replaced -->
</section>
```

The target stays in the DOM, preserving listeners and component state.

### `delete`

Removes element (ignores response content).

```html
<!-- This... -->
<div hx-delete="..." hx-swap="delete">
  ...
</div>
<!-- ...is removed -->
```

### `none`

Doesn't insert content.

```html
<div hx-get="..." hx-swap="none">
  <!-- Response not inserted, but OOB swaps happen -->
</div>
```

[`hx-swap-oob`](/reference/attributes/hx-swap-oob) and [`<hx-partial>`](/reference/tags/hx-partial) swaps still work.

### `upsert`

Updates existing elements by ID and inserts new ones.

```html
<div hx-get="..." hx-swap="upsert">
  <!-- Existing elements with matching IDs are updated, new ones are inserted -->
</div>
```

*Requires the [`hx-upsert`](/extensions/hx-upsert) extension.*

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

```html
<div hx-swap="innerHTML swap:1s"></div>
```

Useful for showing loading states or coordinating with CSS animations.

Default: `0ms`

### `settle`

Adds delay between the swap and the settle phase.

```html
<div hx-swap="innerHTML settle:200ms"></div>
```

Useful for synchronizing htmx with CSS transition timing.

Default: `1ms`

### `ignoreTitle`

Prevents updating the page `<title>`.

```html
<div hx-swap="innerHTML ignoreTitle:true"></div>
```

By default, htmx updates the page title from response `<title>` tags.

### `scroll`

Auto-scroll to swapped content.

```html
<div hx-swap="beforeend scroll:bottom"></div>
```

Useful for infinite scroll, chat messages, or focusing attention on new content.

Values: `top`, `bottom`

Target a different element:

```html
<div hx-swap="innerHTML scroll:top scrollTarget:#other"></div>
```

Scroll the window:

```html
<div hx-swap="innerHTML scroll:window:top"></div>
```

### `show`

Scrolls to show the target element in viewport.

```html
<div hx-swap="innerHTML show:top"></div>
```

Values: `top`, `bottom`, `none`

Show a different element:

```html
<div hx-swap="innerHTML show:top showTarget:#other"></div>
```

Boosted forms default to `show:top`. Disable:

```html
<form hx-swap="show:none"></form>
```

### `focusScroll`

Controls whether restoring focus after a swap scrolls the focused element into view.

```html
<input id="search" hx-get="/search" hx-swap="innerHTML focusScroll:true">
```

Default: [`htmx.config.defaultFocusScroll`](/reference/config/htmx-config-defaultFocusScroll)

### `target`

Sets the swap target.

```html
<div hx-swap="innerHTML target:#results"></div>
```

Alternative to the [`hx-target`](/reference/attributes/hx-target) attribute.

### `strip`

Controls whether the response's outer element is removed.

Response:

```html
<section><p>Hello</p></section>
```

Results:

```html
<!-- strip:true -->
<div id="target"><p>Hello</p></div>

<!-- strip:false -->
<div id="target"><section><p>Hello</p></section></div>
```

### `swapEmpty`

Controls the main target when no main content remains.

The server might send:

```html
<div id="notice" hx-swap-oob="true">Updated</div>
```

After htmx extracts the `hx-swap-oob` update, no main content remains:

```text
(empty)
```

Use `swapEmpty` to keep the target or clear it:

```html
<!-- Keep the main target -->
<div hx-swap="innerHTML swapEmpty:false">Original</div>

<!-- These are equivalent -->
<div hx-swap="innerHTML swapEmpty:true">Original</div>
<div hx-swap="innerHTML swapEmpty">Original</div>
```

Default behavior: skip if partials or OOB swaps were extracted (unless [`htmx.config.allowEmptySwapAfterOOB`](/reference/config/htmx-config-allowEmptySwapAfterOOB) is `true`)

## Caveats

- On `<body>`, `outerHTML` behaves like [`outerSync`](#outersync):

  ```html
  <!-- This... -->
  <body hx-get="..." hx-swap="outerHTML">...</body>

  <!-- ...behaves like this -->
  <body hx-get="..." hx-swap="outerSync">...</body>
  ```

  This is because replacing `<body>` would remove its event listeners and state.

## See Also

- [`HX-Reswap`](/reference/headers/HX-Reswap)

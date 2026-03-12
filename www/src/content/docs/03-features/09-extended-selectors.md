---
title: "Extended Selectors"
description: "Use CSS selectors extended with relative targeting"
---

Extended selectors let you target elements in flexible ways.

Use them with [`hx-target`](/reference/attributes/hx-target), [`hx-sync`](/reference/attributes/hx-sync), and other attributes that accept selectors.

## Standard CSS Selectors

Start with any CSS selector.

```html
<!-- Target by ID -->
<button hx-get="/data" hx-target="#results">Load</button>

<!-- Target by class -->
<button hx-get="/data" hx-target=".container">Load</button>

<!-- Target by attribute -->
<button hx-get="/data" hx-target="[data-results]">Load</button>
```

## `this`

Target the element itself.

```html
<!-- Update the button when clicked -->
<button hx-get="/status" hx-target="this">Check Status</button>
```

The button will replace itself with the response.

## `closest <selector>`

Find the nearest ancestor matching the selector.

Searches upward through parent elements.

```html
<div class="card">
  <div class="card-body">
    <button hx-get="/refresh" hx-target="closest .card">Refresh</button>
  </div>
</div>
```

The button targets its parent `.card` element.

Works like [Element.closest()](https://developer.mozilla.org/docs/Web/API/Element/closest).

## `find <selector>`

Find the first child matching the selector.

Searches downward through descendant elements.

```html
<div hx-get="/user" hx-target="find .username">
  <span class="username">Loading...</span>
</div>
```

The div targets its child `.username` element.

Works like [Element.querySelector()](https://developer.mozilla.org/docs/Web/API/Element/querySelector).

## `findAll <selector>`

Find all children matching the selector.

```html
<div hx-get="/items" hx-target="findAll .item">
  <div class="item">Item 1</div>
  <div class="item">Item 2</div>
</div>
```

Targets all `.item` elements inside the div.

Works like [Element.querySelectorAll()](https://developer.mozilla.org/docs/Web/API/Element/querySelectorAll).

## `next`

Target the next sibling element.

```html
<button hx-get="/more" hx-target="next">Load More</button>
<div>Content loads here</div>
```

Targets the element immediately after the button.

Works like [`Element.nextElementSibling`](https://developer.mozilla.org/docs/Web/API/Element/nextElementSibling).

## `next <selector>`

Scan forward for the first matching element.

Searches through all following siblings.

```html
<button hx-get="/data" hx-target="next .results">Load</button>
<div class="other">Not here</div>
<div class="results">Loads here</div>
```

Skips siblings until it finds `.results`.

## `previous`

Target the previous sibling element.

```html
<div>Content loads here</div>
<button hx-get="/more" hx-target="previous">Load More</button>
```

Targets the element immediately before the button.

Works like [Element.previousElementSibling](https://developer.mozilla.org/docs/Web/API/Element/previousElementSibling).

## `previous <selector>`

Scan backward for the first matching element.

Searches through all preceding siblings.

```html
<div class="results">Loads here</div>
<div class="other">Not here</div>
<button hx-get="/data" hx-target="previous .results">Load</button>
```

Skips siblings until it finds `.results`.

## Special Keywords

### `body`

Target the document body.

```html
<button hx-get="/page" hx-target="body">Load Page</button>
```

Useful for full-page updates.

### `document`

Reference the entire document.

```html
<div hx-trigger="click from:document">...</div>
```

Used primarily with event triggers.

### `window`

Reference the window object.

```html
<div hx-trigger="scroll from:window">...</div>
```

Used primarily with window events.

### `host`

Target the shadow DOM host element.

```html
<!-- Inside shadow DOM -->
<button hx-get="/data" hx-target="host">Update Host</button>
```

Only works inside shadow DOM.

## `global <selector>`

Search the entire document tree.

By default, selectors search within the current shadow DOM boundary.

```html
<!-- Inside shadow DOM -->
<button hx-get="/data" hx-target="global #results">Load</button>

<!-- Targets #results in the main document -->
<div id="results"></div>
```

Crosses shadow DOM boundaries.

## Multiple Targets

Separate multiple selectors with commas.

```html
<button hx-get="/data" hx-target="#results, #cache">Load</button>
```

Updates both elements with the response.

## Hyperscript-Style Syntax

Wrap selectors in `<.../>` for hyperscript compatibility.

```html
<button hx-get="/data" hx-target="<#results/>">Load</button>
```

This mimics [hyperscript query literals](https://hyperscript.org/expressions/query-reference/).

Useful if you're using hyperscript alongside htmx.

## Common Patterns

### Update parent card

```html
<div class="card">
  <button hx-delete="/item/1" hx-target="closest .card">Delete</button>
</div>
```

### Update sibling container

```html
<button hx-get="/data" hx-target="next .results">Load</button>
<div class="results"></div>
```

### Update self

```html
<div hx-get="/refresh" hx-target="this">Click to refresh</div>
```

### Update child element

```html
<div hx-get="/user" hx-target="find .username">
  <span class="username">Loading...</span>
</div>
```

## Tips

Start with simple CSS selectors.

Use `this` for self-updates.

Use `closest` to update parent containers.

Use `find` to update child elements.

Use `next` and `previous` for sibling relationships.

Avoid `id` attributes when relative selectors work.

This keeps your HTML cleaner.

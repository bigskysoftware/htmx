---
title: "hx-target"
description: "Specify target element for swap"
---

Specifies where to insert the response content.

Defaults to `this` (which represents the element making the request).

## Value

### `this`

Target the element itself.

```html
<a hx-post="/new-link" hx-target="this" hx-swap="outerHTML">
  New link
</a>
```

The link updates itself when clicked.

### Extended Selectors

Use any [extended selector](/docs/features/extended-selectors) to target elements:

* CSS selectors: `#results`, `.container`, `[data-target]`
* `closest <selector>` - nearest ancestor matching selector
* `find <selector>` - first child matching selector
* `next` - next sibling element
* `next <selector>` - scan forward for selector
* `previous` - previous sibling element
* `previous <selector>` - scan backward for selector
* And more...

See the full [extended selectors](/docs/features/extended-selectors) guide.

## Common Patterns

### Target a specific element

```html
<button hx-post="/register" hx-target="#response-div">
  Register
</button>
<div id="response-div"></div>
```

### Update parent container

```html
<div class="card">
  <button hx-get="/refresh" hx-target="closest .card">
    Refresh Card
  </button>
</div>
```

### Update sibling element

```html
<button hx-get="/data" hx-target="next .results">Load</button>
<div class="results"></div>
```

### Update child element

```html
<div hx-get="/user" hx-target="find .status">
  <span class="status">Loading...</span>
</div>
```

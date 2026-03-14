---
title: "hx-status"
description: "Handle responses differently by status code"
---

The `hx-status` attribute overrides swap behavior based on the HTTP response status code.

## Examples

```html
<!-- Show validation errors in a specific container -->
<form hx-post="..."
      hx-status:422="target:#errors select:#validation-errors">
  ...
</form>

<!-- Suppress swap on server errors -->
<button hx-post="..." hx-status:5xx="swap:none">Save</button>

<!-- Push a custom URL on 201 Created -->
<form hx-post="..." hx-status:201="push:/items/new">...</form>
```

## Patterns

The status code goes after the colon: `hx-status:CODE="..."`.

Supports exact codes, single-digit wildcards (`x`), and range wildcards (`xx`):

```html
<div hx-get="..."
     hx-status:404="select:#not-found"
     hx-status:50x="select:#bad-gateway"
     hx-status:5xx="swap:none">
  ...
</div>
```

Evaluated in order of specificity: exact match (`404`), then 2-digit wildcard (`50x`), then 1-digit wildcard (`5xx`).

## Modifiers

The value takes space-separated `key:value` pairs.

```html
<form hx-post="..."
      hx-status:422="swap:innerHTML target:#errors select:#validation-errors"
      hx-status:500="swap:none push:false">
  ...
</form>
```

### `swap`

Swap style for this status code. See [`hx-swap` styles](/reference/attributes/hx-swap#styles) for values.

```html
<div hx-get="..." hx-status:500="swap:none"></div>
```

### `target`

CSS selector for the swap target. Overrides [`hx-target`](/reference/attributes/hx-target).

```html
<div hx-get="..." hx-status:422="target:#error-container"></div>
```

### `select`

CSS selector to pick content from the response. Overrides [`hx-select`](/reference/attributes/hx-select).

```html
<div hx-get="..." hx-status:422="select:#validation-errors"></div>
```

### `push`

Push a URL to browser history. `true`/`false`, or a URL string.

```html
<div hx-get="..." hx-status:5xx="push:false"></div>
<form hx-post="/items" hx-status:201="push:/items/new"></form>
```

### `replace`

Replace the current URL in browser history. `true`/`false`, or a URL string.

```html
<div hx-get="..." hx-status:301="replace:/new-location"></div>
```

### `transition`

Use the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) for this swap. `true`/`false`.

```html
<div hx-get="..." hx-status:200="transition:true"></div>
```

## Notes

* Values override response headers ([`HX-Retarget`](/reference/headers/HX-Trigger), `HX-Reswap`, etc.)
* Without `hx-status`, htmx swaps all responses except [`204`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/204) and [`304`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304)

## See Also

* [`hx-swap`](/reference/attributes/hx-swap)
* [`hx-select`](/reference/attributes/hx-select)
* [`hx-target`](/reference/attributes/hx-target)
* [`htmx.config.noSwap`](/reference/config/htmx-config-noSwap)

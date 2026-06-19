---
title: "htmx.config.morphPreserveChildrenOf"
description: "CSS selector for elements whose children morph preserves"
---

The `htmx.config.morphPreserveChildrenOf` option preserves the children of matching elements during morph. Attributes still change normally.

**Default:** `null`

## Example

```javascript
htmx.config.morphPreserveChildrenOf = "lit-component, .sortable";
```

```html
<meta name="htmx-config" content="morphPreserveChildrenOf: 'lit-component, .sortable'">
```

## When to use

For elements whose **children are managed by something other than the server response**: web components that render their own DOM, jQuery plugins (Select2 on `<select>`, Sortable.js on `<ul>`), canvas-based libraries (Chart.js, Leaflet), text editors (CodeMirror, TinyMCE), Alpine `<template x-for>` parents, etc.

The element's attributes still update (so you can push new state via attrs), but morph leaves the children alone.

**Per-element alternative:** use the [`hx-preserve:children`](/reference/attributes/hx-preserve) attribute on the element itself. The global config and per-element attribute can be used together; either one causes children-list preservation.

## Difference from `morphPreserve`

| | Attributes | Children |
|---|---|---|
| `morphPreserve` | preserved | preserved |
| `morphPreserveChildrenOf` | morphed | preserved |

## See also

- [`morphPreserve`](/reference/config/htmx-config-morphPreserve), preserve the whole element
- [`morphPreserveAttributes`](/reference/config/htmx-config-morphPreserveAttributes), preserve specific attribute names
- [`hx-preserve`](/reference/attributes/hx-preserve), per-element preservation across all swap types

---
title: "&lt;hx-partial&gt;"
description: "Targets multiple elements with one response"
keywords: ["hx-partial", "partial", "partials"]
---

The `<hx-partial>` tag lets you update multiple elements from a single response, with explicit control over targeting and swap strategy.

## Syntax

```html
<hx-partial hx-target="#messages" hx-swap="beforeend">
    <div>New message</div>
</hx-partial>

<hx-partial hx-target="#count">
    <span>5</span>
</hx-partial>
```

## Attributes

- [`hx-target`](/reference/attributes/hx-target) - Where to place content. Accepts any CSS selector or htmx extended selector, resolved relative to the element that triggered the request
- `id` - Shorthand alternative to `hx-target`. Targets the element with that ID (e.g. `<hx-partial id="messages">` targets `#messages`)
- [`hx-swap`](/reference/attributes/hx-swap) - Swap style (defaults to `innerHTML`)

Either `hx-target` or `id` is required. If both are present, `hx-target` takes precedence.

## Relative Targeting

`hx-target` supports the full htmx extended selector vocabulary — `closest`, `next`, `previous`, `find`, `findAll` — resolved relative to the element that triggered the request. This lets the server express structural intent without requiring stable IDs:

```html
<!-- replace the list row containing the button that was clicked -->
<hx-partial hx-target="closest li" hx-swap="outerHTML">
    <li>Updated item <button hx-post="/edit/2">Edit</button></li>
</hx-partial>

<!-- update the error element after the input that triggered validation -->
<hx-partial hx-target="next .error">
    <span class="error">Required</span>
</hx-partial>
```

Avoid targeting an ancestor that the main swap is also replacing — the partial would be swapping into a detached node.

## Responses Without Main Content

When a response contains only `<hx-partial>` tags (no main content), the main target is left untouched. This is by design — partials are true response separators where each section is self-contained, giving the server explicit control over multi-target updates.

Unlike [`hx-swap-oob`](/reference/attributes/hx-swap-oob), this behavior cannot be changed globally. Use the `swapEmpty:true` modifier on `hx-swap` if you need to clear the main target:

```html
<button hx-post="/submit" hx-swap="innerHTML swapEmpty:true">Submit</button>
```

## Alternative Syntax

Template languages that strip unknown tags can use the equivalent `<template>` form:

```html
<template hx type="partial" hx-target="#messages" hx-swap="beforeend">
    <div>New message</div>
</template>
```

## See Also

- [`hx-swap-oob`](/reference/attributes/hx-swap-oob), an alternative for simple ID-based updates
- [Multi-Target Updates](/docs#multi-target-updates) for full documentation
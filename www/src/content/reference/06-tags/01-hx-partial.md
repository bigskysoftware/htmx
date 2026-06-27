---
title: "<hx-partial>"
description: "Target multiple elements from a single response"
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

- [`hx-target`](/reference/attributes/hx-target) - CSS selector for where to place content
- `id` - Shorthand alternative to `hx-target`. Targets the element with that ID (e.g. `<hx-partial id="messages">` targets `#messages`)
- [`hx-swap`](/reference/attributes/hx-swap) - Swap style (defaults to `innerHTML`)

Either `hx-target` or `id` is required. If both are present, `hx-target` takes precedence.

## Responses Without Main Content

When a response contains only `<hx-partial>` tags (no main content), the main target is left untouched. See [Multi-Target Updates](/docs#choosing-between-them) for details.

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
---
title: "Upsert"
description: "Update-or-insert swap strategy for dynamic lists"
keywords: ["upsert", "swap", "list", "update", "insert"]
---

The `upsert` extension adds a new swap style that intelligently updates existing elements by ID and inserts new ones, while preserving elements not in the response. This is particularly useful for maintaining dynamic lists where you want to update specific items without replacing the entire container.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-upsert.js"></script>
```

## Usage

Use [`hx-swap`](/reference/attributes/hx-swap)`="upsert"` to apply the upsert behavior:

```html
<button hx-get="/items" hx-swap="upsert" hx-target="#item-list">
    Refresh Items
</button>

<div id="item-list">
    <div id="item-1">Original Item 1</div>
    <div id="item-2">Original Item 2</div>
</div>
```

When the server responds with:

```html
<div id="item-2">Updated Item 2</div>
<div id="item-3">New Item 3</div>
```

The result will be:

```html
<div id="item-list">
    <div id="item-1">Original Item 1</div>
    <div id="item-2">Updated Item 2</div>
    <div id="item-3">New Item 3</div>
</div>
```

## How It Works

The upsert swap style:

1. **Updates** elements with matching IDs (replaces their outerHTML)
2. **Inserts** new elements that don't have matching IDs
3. **Preserves** existing elements not present in the response

## Configuration

### Sorting

Add `sort` to maintain elements in ascending order by ID:

```html
<div hx-get="/items" hx-swap="upsert sort">
```

Use `sort:desc` for descending order:

```html
<div hx-get="/items" hx-swap="upsert sort:desc">
```

### Custom Key Attribute

Use `key:attr` to sort by a different attribute:

```html
<div hx-get="/items" hx-swap="upsert key:data-priority sort">
    <div id="task-2" data-priority="1">High Priority</div>
    <div id="task-1" data-priority="5">Low Priority</div>
</div>
```

### Prepend Unkeyed Elements

By default, elements without IDs are appended. Use `prepend` to insert them at the beginning:

```html
<div hx-get="/items" hx-swap="upsert prepend">
```

### Combined Modifiers

```html
<div hx-get="/items" hx-swap="upsert sort:desc prepend">
```

## Using with [`<hx-partial>`](/docs/core-concepts/multi-target-updates#partials-hx-partial)

You can use `<hx-partial>` with `hx-swap="upsert"` for targeted upserts in a single response:

```html
<hx-partial hx-target="#main" hx-swap="innerHTML">
    <div>Updated main content</div>
</hx-partial>
<hx-partial hx-target="#item-list" hx-swap="upsert sort">
    <div id="item-2">Updated Item 2</div>
    <div id="item-5">New Item 5</div>
</hx-partial>
```

## Limitations

- Only elements with `id` attributes can be matched and updated
- IDs must be unique across the entire document
- Sorting uses numeric-aware `localeCompare`, which may have performance implications for very large lists

+++
title = "htmx Upsert Extension"
+++

The `upsert` extension adds a new swap style that intelligently updates existing elements by ID and inserts new ones, while preserving elements not in the response. This is particularly useful for maintaining dynamic lists where you want to update specific items without replacing the entire container.

## Installing

### Via CDN

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha6/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha6/dist/ext/hx-upsert.js"></script>
```

### Download

Download the files and include them in your project:

```html
<script src="/path/to/htmx.min.js"></script>
<script src="/path/to/hx-upsert.js"></script>
```

### npm

For npm-style build systems:

```sh
npm install htmx.org@4.0.0-alpha6
```

Then include both files:

```html
<script src="node_modules/htmx.org/dist/htmx.min.js"></script>
<script src="node_modules/htmx.org/dist/ext/hx-upsert.js"></script>
```

### Module Imports

When using module bundlers:

```javascript
import htmx from 'htmx.org';
import 'htmx.org/dist/ext/hx-upsert';
```

The extension registers automatically when loaded. No `hx-ext` attribute is needed in htmx 4.

## Usage

Once loaded, simply use `hx-swap="upsert"` to apply the upsert behavior:

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

### Using `<hx-upsert>` Tags

You can also use `<hx-upsert>` tags in server responses for targeted upserts:

```html
<div id="main">Main content</div>
<hx-upsert hx-target="#item-list" key="data-id" sort="desc">
    <div id="item-2" data-id="2">Updated Item 2</div>
    <div id="item-4" data-id="4">New Item 4</div>
</hx-upsert>
```

The `<hx-upsert>` tag supports:
- `hx-target` - target selector for the upsert
- `key` - attribute name for sorting (e.g., `key="data-priority"`)
- `sort` - sort ascending (use `sort="desc"` for descending)
- `prepend` - prepend elements without keys

### Using with `<hx-partial>`

You can use `<hx-partial>` with `hx-swap="upsert"` for targeted upserts:

```html
<hx-partial hx-target="#main" hx-swap="innerHTML">
    <div>Updated main content</div>
</hx-partial>
<hx-partial hx-target="#item-list" hx-swap="upsert sort">
    <div id="item-2">Updated Item 2</div>
    <div id="item-5">New Item 5</div>
</hx-partial>
```

This allows you to update the main content normally while upserting items in a list, all in a single response.

## How It Works

The upsert swap style:

1. **Updates** elements with matching IDs (replaces their outerHTML)
2. **Inserts** new elements that don't have matching IDs
3. **Preserves** existing elements not present in the response

## Configuration

### Basic Upsert

```html
<div hx-get="/items" hx-swap="upsert">
    <div id="item-1">Item 1</div>
</div>
```

### Sorting

Add `sort` to maintain elements in ascending order by ID:

```html
<div hx-get="/items" hx-swap="upsert sort">
    <div id="item-1">Item 1</div>
    <div id="item-3">Item 3</div>
</div>
```

After receiving `<div id="item-2">Item 2</div>`, the order will be: item-1, item-2, item-3.

**Note:** Sorting only applies to newly inserted elements. The existing elements in the target should already be in sorted order. The sort feature finds the correct position for new elements within the existing sorted list.

### Descending Sort

Use `sort:desc` for descending order:

```html
<div hx-get="/items" hx-swap="upsert sort:desc">
    <div id="item-1">Item 1</div>
</div>
```

### Custom Key Attribute

Use `key:attr` to sort by a different attribute:

```html
<div hx-get="/items" hx-swap="upsert key:data-priority sort">
    <div id="task-2" data-priority="1">High Priority</div>
    <div id="task-1" data-priority="5">Low Priority</div>
</div>
```

New items will be inserted in the correct position based on their `data-priority` value.

### Prepend Unkeyed Elements

By default, elements without IDs are appended. Use `prepend` to insert them at the beginning:

```html
<div hx-get="/items" hx-swap="upsert prepend">
    <div id="item-1">Item 1</div>
</div>
```

When receiving `<div>No ID</div>`, it will be inserted before item-1.

### Combined Modifiers

```html
<div hx-get="/items" hx-swap="upsert sort:desc prepend">
    <!-- Sorts descending and prepends unkeyed elements -->
</div>
```

## Use with hx-swap-oob

The upsert swap style works with out-of-band swaps:

```html
<div hx-get="/update" hx-swap="innerHTML">
    <div id="main">Main content</div>
</div>

<div id="sidebar">
    <div id="item-1">Sidebar Item 1</div>
</div>
```

Server response:

```html
<div id="main">Updated main content</div>
<div id="sidebar" hx-swap-oob="upsert">
    <div id="item-2">New Sidebar Item</div>
</div>
```

The sidebar will be upserted while main content is replaced normally.

## Examples

### Dynamic Todo List

```html
<form hx-post="/todos" hx-swap="upsert sort" hx-target="#todo-list">
    <input name="task" placeholder="New task">
    <button type="submit">Add</button>
</form>

<div id="todo-list">
    <div id="todo-1">Buy groceries</div>
    <div id="todo-2">Walk the dog</div>
</div>
```

### Live Scoreboard

```html
<div hx-get="/scores" 
     hx-trigger="every 5s"
     hx-swap="upsert key:data-score sort:desc"
     id="scoreboard">
    <div id="player-1" data-score="100">Alice: 100</div>
    <div id="player-2" data-score="85">Bob: 85</div>
</div>
```

## Limitations

* Only elements with `id` attributes can be matched and updated
* The extension uses `document.getElementById()` for matching, so IDs must be unique across the entire document
* Sorting uses numeric-aware `localeCompare`, which may have performance implications for very large lists
* Elements without keys (no ID or key attribute) cannot be individually updated


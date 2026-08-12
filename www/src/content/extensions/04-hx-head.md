---
title: "hx-head"
description: "Merge `<head>` tags with `hx-head='merge'`"
category: "Swaps"
icon: "icon-[mdi--page-layout-header]"
keywords: ["head", "styles", "scripts", "merge", "append"]
---

The `hx-head` extension lets htmx responses update the document's [`<head>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head) without a full page load.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-head.min.js"></script>
```

## Usage

### Add Head Content

Use `hx-head="append"` to add styles, scripts, or metadata without removing the current `<head>`:

```html
<button hx-get="/dark-theme" hx-target="#preview">
  Preview Dark Theme
</button>
<div id="preview">Light theme</div>
```

The server responds with a `<head>` and `<body>`:

```html
<html>
<head hx-head="append">
  <link rel="stylesheet" href="/dark-theme.css">
</head>
<body>
  Dark theme enabled
</body>
</html>
```

htmx adds the stylesheet, then swaps the body content into `#preview`:

```html
<head>
  <!-- Existing head content -->
  <link rel="stylesheet" href="/dark-theme.css">
</head>
<body>
  <button hx-get="/dark-theme" hx-target="#preview">
    Preview Dark Theme
  </button>
  <div id="preview">Dark theme enabled</div>
</body>
```

### Replace Head Content

Use `hx-head="merge"` when a response represents a new page:

```html
<a hx-get="/settings" hx-target="body">Settings</a>
```

The current page contains:

```html
<head>
  <title>Home</title>
  <link rel="stylesheet" href="/site.css">
  <link rel="stylesheet" href="/home.css">
</head>
```

The server responds with the complete `<head>` for the settings page:

```html
<html>
<head hx-head="merge">
  <title>Settings</title>
  <link rel="stylesheet" href="/site.css">
  <link rel="stylesheet" href="/settings.css">
</head>
<body>
  <h1>Settings</h1>
</body>
</html>
```

The merge keeps exact matches, adds new elements, and removes elements missing from the response:

```html
<head>
  <title>Settings</title>
  <link rel="stylesheet" href="/site.css">
  <link rel="stylesheet" href="/settings.css">
</head>
<body>
  <h1>Settings</h1>
</body>
```

### Keep Existing Head Content

A merge removes current elements missing from the response. Add [`hx-preserve="true"`](/reference/attributes/hx-preserve) to keep one:

```html
<head>
  <script src="/analytics.js" hx-preserve="true"></script>
</head>
```

The script remains even when the next response `<head>` omits it.

## Attributes

### `hx-head`

Set `hx-head` on a response `<head>` to choose how it updates the document head:

```html
<head hx-head="<strategy>">
  ...
</head>
```

#### `hx-head="merge"`

Add response elements and remove current elements missing from the response:

```html
<head hx-head="merge">
  ...
</head>
```

New elements are added at the end of the current `<head>`.

#### `hx-head="append"`

Add response elements without removing current elements:

```html
<head hx-head="append">
  ...
</head>
```

New elements are added at the end of the current `<head>`.

#### `hx-head="re-eval"`

Set `hx-head="re-eval"` on a `<head>` child to replace and run an exact match again:

```html
<head hx-head="merge">
  <script hx-head="re-eval">
    initializePage()
  </script>
</head>
```

The response must include the element each time it should run.

#### Defaults

You can omit `hx-head` from the response. The request target chooses the strategy:

| Request target | Default | Effect |
|---|---|---|
| `body` | `merge` | Make the current `<head>` match the response `<head>` |
| Any other element | `append` | Add response elements without removing current elements |

## Events

Event data is available on `event.detail`.

Element events expose:

```js
event.detail.headElement // Element being added or removed
```

### `htmx:head:before:merge`

Fires before the extension processes a response `<head>`.

```js
document.addEventListener('htmx:head:before:merge', event => {
  if (!shouldUpdateHead(event.detail.ctx)) event.preventDefault()
})
```

The event detail includes the request `ctx`. Cancel the event to skip all head processing for the response.

### `htmx:head:before:add`

Fires before the extension adds a head element.

```js
document.addEventListener('htmx:head:before:add', event => {
  if (event.detail.headElement.matches('script[data-untrusted]')) {
    event.preventDefault()
  }
})
```

Cancel the event to skip that element.

### `htmx:head:before:remove`

Fires before the extension removes a current `<head>` element.

```js
document.addEventListener('htmx:head:before:remove', event => {
  if (event.detail.headElement.matches('[data-keep]')) {
    event.preventDefault()
  }
})
```

Cancel the event to keep that element.

### `htmx:head:after:merge`

Fires after the extension finishes updating the `<head>`.

```js
event.detail = {
  added,   // Added elements
  kept,    // Exact matches left in place
  removed  // Removed elements
}
```

```js
document.addEventListener('htmx:head:after:merge', event => {
  console.log('Head elements added:', event.detail.added.length)
})
```

## Migration

### Beta to RC1

RC1 namespaces `hx-head` lifecycle events:

| Beta | RC1 |
|------|-----|
| `htmx:before:head:merge` | [`htmx:head:before:merge`](#htmxheadbeforemerge) |
| `htmx:before:head:add` | [`htmx:head:before:add`](#htmxheadbeforeadd) |
| `htmx:before:head:remove` | [`htmx:head:before:remove`](#htmxheadbeforeremove) |
| `htmx:after:head:merge` | [`htmx:head:after:merge`](#htmxheadaftermerge) |

## Notes

- `<style>` applies and `<script>` runs before swap; `<script defer>` runs after:

  ```html
  <head hx-head="append">
    <!-- Applies before swap -->
    <style>...</style>

    <!-- Runs before swap -->
    <script src="/app.js"></script>

    <!-- Runs after swap -->
    <script src="/after.js" defer></script>
  </head>
  ```

- Responses can contain `<head>` tags without a root `<html>` element:

  ```html
  <!-- No <html> wrapper -->
  <head hx-head="append">
    <meta name="theme-color" content="#000">
  </head>
  <div>Saved</div>
  ```

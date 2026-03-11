---
title: "Preload"
description: "Preload content on hover or other events for near-instant page loads"
keywords: ["preload", "prefetch", "performance", "hover", "mousedown"]
---

The `preload` extension allows you to load HTML fragments into your browser's cache before they are requested by the user, so that additional pages appear to load nearly instantaneously.

**Important:** Preloading content judiciously can improve your web application's perceived performance, but preloading too many resources can negatively impact your visitors' bandwidth and your server performance. Use this extension carefully!

## Installing

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-preload.js"></script>
```

## Usage

Add a `preload` attribute to any hyperlinks and `hx-get` elements you want to preload. By default, resources will be loaded as soon as the `mousedown` event begins, giving your application a roughly 100-200ms head start on serving responses.

```html
<a href="/server/1" preload>Preloaded on mousedown</a>
<button hx-get="/server/2" preload>Preloaded with htmx headers</button>
```

All preload requests include an additional `"HX-Preloaded": "true"` header.

### Inheriting Preload Settings

You can add the `preload` attribute to a parent element, and all links within it will be preloaded:

```html
<ul preload>
    <li><a href="/page/1">This will be preloaded</a></li>
    <li><a href="/page/2">This will also be preloaded</a></li>
</ul>
```

## Configuration

### `preload="mousedown"` (default)

Begins loading when the user presses the mouse down. Conservative — guarantees the user intends to click. Gives your server a 100-200ms head start.

### `preload="mouseover"`

Preloads when the user's mouse hovers over the link. A 100ms delay prevents loading when the user scrolls past. More aggressive — gives your server several hundred milliseconds of head start.

### `preload="custom-event-name"`

Preload can listen to any custom event. The extension generates a `preload:init` event that can trigger preloads as soon as an element is processed by htmx.

### `preload="always"`

By default, the extension preloads each element once. Use `preload="always"` to preload on every trigger. Can be combined with other options: `preload="always mouseover"`.

## Limitations

- Only `GET` requests can be preloaded (including `<a href="">` and `hx-get=""`). POST, PUT, and DELETE will not be preloaded.
- When listening to `mouseover` events, preload waits 100ms before downloading. If the mouse leaves before the timeout, the resource is not preloaded.
- Preloaded responses will only be cached if the response headers allow it (e.g., `Cache-Control: private, max-age=60`).

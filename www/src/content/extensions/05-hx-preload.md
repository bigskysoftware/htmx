---
title: "hx-preload"
description: "Preload content on hover for instant page loads"
category: "Performance"
icon: "icon-[mdi--rocket-launch-outline]"
keywords: ["preload", "prefetch", "performance", "hover", "mousedown"]
---

The `preload` extension allows you to load HTML fragments into your browser's cache before they are requested by the user, so that additional pages appear to load nearly instantaneously.

**Important:** Preloading content judiciously can improve your web application's perceived performance, but preloading too many resources can negatively impact your visitors' bandwidth and your server performance. Use this extension carefully!

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-preload.js"></script>
```

## Usage

Add an `hx-preload` attribute to any boosted hyperlinks and [`hx-get`](/reference/attributes/hx-get) elements you want to preload. By default, resources will be loaded as soon as the `mousedown` event begins, giving your application a roughly 100-200ms head start on serving responses.

```html
<button hx-get="/server/1" hx-preload>Preloaded on mousedown</button>
<button hx-get="/server/2" hx-preload="mouseover">Preloaded on mouseover</button>
```

All preload requests include an additional `HX-Preloaded: true` header.

## hx-boost Integration

When the preload extension is loaded, all [`hx-boost`](/reference/attributes/hx-boost) anchor tags are automatically preloaded on `mousedown` without needing an explicit `hx-preload` attribute. To opt out of this behaviour, set `htmx.config.preload.autoBoost = false`.

```html
<!-- these are all automatically preloaded when the preload extension is loaded -->
<nav hx-boost="true">
    <a href="/page1">Page 1</a>
    <a href="/page2">Page 2</a>
</nav>
```

To disable auto-preloading of boosted links:

```html
<meta name="htmx-config" content='preload:{"autoBoost":false}'>
```

Plain `<a href>` links without `hx-boost` cannot be preloaded, as preloading works by warming an htmx request — it does not intercept browser navigation.

## Trigger Events

### `hx-preload` / `hx-preload="mousedown"` (default)

Begins loading when the user presses the mouse down. Conservative — guarantees the user intends to click. Gives your server a 100-200ms head start.

### `hx-preload="mouseover"`

Preloads when the user's mouse hovers over the element. More aggressive — gives your server several hundred milliseconds of head start.

### `hx-preload="custom-event-name"`

Preload can listen to any event name supported by htmx trigger specs.

```html
<button hx-get="/data" hx-preload="focus">Preload on focus</button>
```

## Configuration

All options are set via `htmx.config.preload`:

| Option | Default | Description |
|--------|---------|-------------|
| `autoBoost` | `true` | Automatically preload all `hx-boost` anchor tags on `mousedown` |
| `boostEvent` | `"mousedown"` | The event used to trigger preloading for auto-boosted links |
| `boostTimeout` | `5000` | Milliseconds before a preloaded response for a boosted link expires |

```html
<meta name="htmx-config" content='preload:{"autoBoost":true,"boostEvent":"mouseover","boostTimeout":"3s"}'>
```

## Timeout

Preloaded responses expire after 5 seconds by default. Use the `timeout` modifier to override per element:

```html
<button hx-get="/data" hx-preload="mousedown timeout:2s">Expires after 2s</button>
```

## Limitations

- Only `GET` requests can be preloaded. `POST`, `PUT`, `PATCH` and `DELETE` will not be preloaded.
- Plain `<a href>` links without `hx-boost` or `hx-get` cannot be preloaded.
- Preloaded responses will only be reused if the actual request is made before the timeout expires.

## Upgrading from htmx 2.x

- The `preload` attribute is now named `hx-preload`.
- Inherited preload via a parent element now requires the `:inherited` modifier: `hx-preload:inherited`.

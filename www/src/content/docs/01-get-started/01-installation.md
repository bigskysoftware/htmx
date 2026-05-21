---
title: "Installation"
description: "Install htmx via CDN, npm, or direct download"
thumbnail: "docs/installation.svg"
keywords: [ "install", "setup", "cdn", "npm", "download", "getting started", "quick start" ]
---

htmx is a single JavaScript file with no dependencies. No build step is required to use it.

## CDN

Add this in your `<head>` tag:

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4" integrity="sha384-QSU8eEPO3hB2t20eEzufWO6ScLxBF2S8u7QHNNLRL4IET5zcvx444MHG6+fDzzTT" crossorigin="anonymous"></script>
```

### Unminified

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4/dist/htmx.js" integrity="sha384-G5PQhA8wo5Dkem9VtU3izHNsalIpaptQKXnc/cj8QRc9XeJX2KTO3Pr2KS2A6Eif" crossorigin="anonymous"></script>
```

### ES Module

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4/dist/htmx.esm.min.js" integrity="sha384-E+JDpCUAgcyKFT22Xh4zlu3I5xV0JfjDHlB3jqwPIAemJxXq2Ovlsw8x3DbQ3tc1" crossorigin="anonymous"></script>
```

### ES Module (unminified)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4/dist/htmx.esm.js" integrity="sha384-b3Sl18uCZMYg5GnkP+EDF3gyiYazT9PHLZ0JV75UnL+LP1WGIIxUqTXL7MqM67Ed" crossorigin="anonymous"></script>
```

## Download

Instead of using a CDN, consider [self-hosting in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

1. Download <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4/dist/htmx.min.js">htmx.min.js</a>
2. Save it to your project (e.g., `/js/htmx.min.js`)
3. Add this in your `<head>` tag:

```html
<script src="/js/htmx.min.js"></script>
```

### Other formats

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4/dist/htmx.js">htmx.js</a> (unminified)

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4/dist/htmx.esm.min.js">htmx.esm.min.js</a> (ES module)

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta4/dist/htmx.esm.js">htmx.esm.js</a> (ES module, unminified)

## npm

```sh
npm install htmx.org@4.0.0-beta4
```

```javascript
import 'htmx.org';
```

### Named import

```javascript
import htmx from 'htmx.org';

// Now you can use htmx.ajax(), htmx.find(), etc.
```

## htmax

The `htmax.js` file bundles htmx with the most popular extensions in a single file:

* [SSE](/extensions/hx-sse)
* [WebSockets](/extensions/hx-ws)
* [preload](/extensions/hx-preload)
* [browser-indicator](/extensions/hx-browser-indicator)
* [download](/extensions/hx-download)
* [optimistic](/extensions/hx-optimistic)
* [targets](/extensions/hx-targets)
* [live](/extensions/hx-live).

The extensions are automatically available, you can just use their attributes directly (e.g. `hx-sse:connect`, `hx-ws:connect`).

```html
<script src="/js/htmax.min.js"></script>
```

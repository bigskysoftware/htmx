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
<script defer src="https://cdn.jsdelivr.net/npm/htmx.org@next"
        integrity="sha384-hUj4cz/Dd2p+Dq0r8A6TAMS1u7gu2bTyisk8xCQX3nodazPP+fRmcAWJrTh4Ycwb"
        crossorigin="anonymous"></script>
```

### Unminified

```html
<script defer src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.js"
        integrity="sha384-CHKZYHwIgmpkwoWtoPaiFIiMxP1Up7yHcsZ2NeECzLxRTXCO0mqXlujZwdJgFsFC"
        crossorigin="anonymous"></script>
```

### ES Module

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.min.js"
        integrity="sha384-OPW5afG/4fljvTHsMqWvLnhClMkpDn0js3fDdgGseCQ5ijf4CgOH6yBk4Mh+Lsvb"
        crossorigin="anonymous"></script>
```

### ES Module (unminified)

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.js"
        integrity="sha384-WhiGE30cpMIwAk95UYcKunr7TdMcxfJ9ECtjkYo8ghgAyYXtS9jA4c0TXkVcqBsM"
        crossorigin="anonymous"></script>
```

## Download

Instead of using a CDN, consider [self-hosting in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

1. Download <a download href="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js">htmx.min.js</a>
2. Save it to your project (e.g., `/js/htmx.min.js`)
3. Add this in your `<head>` tag:

```html
<script defer src="/js/htmx.min.js"></script>
```

### Other formats

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.js">htmx.js</a> (unminified)

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.min.js">htmx.esm.min.js</a> (ES module)

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.js">htmx.esm.js</a> (ES module, unminified)

## npm

```sh
npm install htmx.org@next
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

* [SSE](/docs/extensions/sse)
* [WebSockets](/docs/extensions/ws)
* [preload](/docs/extensions/preload)
* [browser-indicator](/docs/extensions/browser-indicator)
* [download](/docs/extensions/download)
* [optimistic](/docs/extensions/optimistic)
* [targets](/docs/extensions/targets).

The extensions are automatically available, you can just use their attributes directly (e.g. `hx-sse:connect`, `hx-ws:connect`).

```html
<script defer src="/js/htmax.min.js"></script>
```
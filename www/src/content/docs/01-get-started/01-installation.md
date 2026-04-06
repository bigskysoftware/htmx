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
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta1"
        integrity="sha384-8Xv0V1jW3pSa0gBFQRhaII4LIJH5RkMcFogG+JxxuJe+5pqh2A54vpZLmVM4i6eP"
        crossorigin="anonymous"></script>
```

### Unminified

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta1/dist/htmx.js"
        integrity="sha384-jQ1sG+xKSq3ymWjKr95FsTq5QOIFwKnJXSVQCnWI2inCvqXdaD+Jzkdp8U9No3rK"
        crossorigin="anonymous"></script>
```

### ES Module

```html
<script type="module"
        src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta1/dist/htmx.esm.min.js"
        integrity="sha384-PcS7xfab7VmrX3d1pc3sw10FpukcW7k3kZT2sFgm1lti8gAT/ti9n9KEq/qRnfLT"
        crossorigin="anonymous"></script>
```

### ES Module (unminified)

```html
<script type="module"
        src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta1/dist/htmx.esm.js"
        integrity="sha384-GoHEyMRmIqjopbRB7AsE8qzm+Igl0F5B1oP2R/zfLCTDY+HGWnuu1gzD7EowCuFO"
        crossorigin="anonymous"></script>
```

## Download

Instead of using a CDN, consider [self-hosting in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

1. Download <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta1/dist/htmx.min.js">htmx.min.js</a>
2. Save it to your project (e.g., `/js/htmx.min.js`)
3. Add this in your `<head>` tag:

```html
<script src="/js/htmx.min.js"></script>
```

### Other formats

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta1/dist/htmx.js">htmx.js</a> (unminified)

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta1/dist/htmx.esm.min.js">htmx.esm.min.js</a> (ES module)

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-beta1/dist/htmx.esm.js">htmx.esm.js</a> (ES module, unminified)

## npm

```sh
npm install htmx.org@4.0.0-beta1
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
<script src="/js/htmax.min.js"></script>
```

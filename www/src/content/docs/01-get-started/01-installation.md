---
title: "Installation"
description: "Install htmx via CDN, npm, or direct download"
thumbnail: "docs/installation.svg"
keywords: [ "install", "setup", "cdn", "npm", "download", "getting started", "quick start" ]
---

htmx is a single JavaScript file with dependencies. No build step is required.

## Method 1: CDN (Fastest)

1. Add this in your `<head>` tag:

```html

<script defer src="https://cdn.jsdelivr.net/npm/htmx.org@next"
        integrity="sha384-hUj4cz/Dd2p+Dq0r8A6TAMS1u7gu2bTyisk8xCQX3nodazPP+fRmcAWJrTh4Ycwb"
        crossorigin="anonymous"></script>
```

<details>
<summary>Other options</summary>

**Unminified (for debugging):**

```html

<script defer src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.js"
        integrity="sha384-CHKZYHwIgmpkwoWtoPaiFIiMxP1Up7yHcsZ2NeECzLxRTXCO0mqXlujZwdJgFsFC"
        crossorigin="anonymous"></script>
```

**ES Module (minified):**

```html

<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.min.js"
        integrity="sha384-OPW5afG/4fljvTHsMqWvLnhClMkpDn0js3fDdgGseCQ5ijf4CgOH6yBk4Mh+Lsvb"
        crossorigin="anonymous"></script>
```

**ES Module (unminified):**

```html

<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.js"
        integrity="sha384-WhiGE30cpMIwAk95UYcKunr7TdMcxfJ9ECtjkYo8ghgAyYXtS9jA4c0TXkVcqBsM"
        crossorigin="anonymous"></script>
```

</details>

## Method 2: Download

Instead of using a CDN, consider [self-hosting in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

1. Download <a download href="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js">htmx.min.js</a>
2. Save it to your project (e.g., `/js/htmx.min.js`)
3. Add this in your `<head>` tag:

```html

<script defer src="/js/htmx.min.js"></script>
```

<details>
<summary>Other options</summary>

**Unminified (for debugging):**

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.js">htmx.js</a>

```html

<script defer src="/js/htmx.js"></script>
```

**ES Module (minified):**

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.min.js">htmx.esm.min.js</a>

```html

<script type="module" src="/js/htmx.esm.min.js"></script>
```

**ES Module (unminified):**

Download: <a download href="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.js">htmx.esm.js</a>

```html

<script type="module" src="/js/htmx.esm.js"></script>
```

</details>

## Method 3: npm

1. Install **htmx** via `npm`:

```sh
npm install htmx.org@next
```

2. Import **htmx** in your JavaScript:

```javascript
import 'htmx.org';
```

<details>
<summary>Other options</summary>

**Named import (for using the JavaScript API):**

```javascript
import htmx from 'htmx.org';

// Now you can use htmx.ajax(), htmx.find(), etc.
```

</details>

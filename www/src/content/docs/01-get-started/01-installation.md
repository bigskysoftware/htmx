---
title: "Installation"
description: "Install htmx via CDN, npm, or direct download"
thumbnail: "docs/installation.svg"
keywords: ["install", "setup", "cdn", "npm", "download", "getting started", "quick start"]
---

htmx is a single JavaScript file. No dependencies. No build step required.

## Method 1: CDN (Fastest)

1. Add this in your `<head>` tag:

```html
<script defer src="https://cdn.jsdelivr.net/npm/htmx.org@next"></script>
```

<details>
<summary>Other options</summary>

**Unminified (for debugging):**
```html
<script defer src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.js"></script>
```

**ES Module (minified):**
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.min.js"></script>
```

**ES Module (unminified):**
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.esm.js"></script>
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

---

## Which Method to Use?

| Method       | Use If...                                    |
|--------------|----------------------------------------------|
| **CDN**      | You're learning or prototyping               |
| **Download** | You want to self-host for production         |
| **npm**      | You're using a bundler (Vite, Webpack, etc.) |

---
title: "Alpine.js Compatibility"
description: "Compatibility layer for using htmx with Alpine.js"
keywords: ["alpine", "alpinejs", "compatibility", "integration"]
---

The `alpine-compat` extension provides compatibility between htmx and [Alpine.js](https://alpinejs.dev/), ensuring that Alpine components work correctly when htmx swaps new content into the DOM.

## Installing

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-alpine-compat.js"></script>
<script defer src="/path/to/alpine.js"></script>
```

## Usage

Once loaded, the extension automatically initializes Alpine.js components in content that htmx swaps into the page. Without this extension, Alpine components in dynamically swapped content would not be initialized.

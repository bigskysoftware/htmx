---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `morphdom-swap` Extension

This extension allows you to use the [morphdom](https://github.com/patrick-steele-idem/morphdom) library as the
swapping mechanism in htmx.

#### Usage

```html
<header>
  <script src="lib/morphdom-umd.js"></script> <!-- include the morphdom library -->
</header>
<body hx-ext="morphdom-swap">
   <button hx-swap="morphdom">This button will be swapped with morphdom!</button>
</body>
```

#### Source

<https://unpkg.com/htmx.org/ext/morphdom-swap.js>


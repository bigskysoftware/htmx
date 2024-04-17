+++
title = "morphdom-swap"
+++

This extension allows you to use the [morphdom](https://github.com/patrick-steele-idem/morphdom) library as the
swapping mechanism in htmx.

The `morphdom` library does not support morph element to multiple elements. If the result of `hx-select` is more than one element, it will pick the first one.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/morphdom-swap.js"></script>
```

### Usage

```html
<header>
  <script src="lib/morphdom-umd.js"></script> <!-- include the morphdom library -->
</header>
<body hx-ext="morphdom-swap">
   <button hx-swap="morphdom">This button will be swapped with morphdom!</button>
</body>
```

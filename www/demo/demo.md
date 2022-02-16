---
layout: layout.njk
title: </> htmx - high power tools for html
---

# htmx demo helper script

By adding the script tag below to your demo site (e.g. jsFiddle) you will have a full installation of
<a href="https://htmx.org">htmx</a> and <a href="https://hyperscript.org">hyperscript</a> for your
demo.


Additionally, you can add mock responses by simply adding `template` tags with the
`url` attribute. The response for that url will be the innerHTML of the template. You
    may embed simple expressions in the template with a `${}` syntax.

## Code

Copy this to your demo site:

```html
  <script src="https://htmx.org/js/demo.js"></script>
```

## Example

This is an example of the code in action:

```html
<script src="https://htmx.org/js/demo.js"></script>
<!-- post to /foo -->
<button hx-post="/foo" hx-target="#result">Count Up</button> <output id="result"></output>
<!-- respond to /foo -->
<script>
    globalInt = 0;
</script>
<template url="/foo">
    ${globalInt++}
</template>
```

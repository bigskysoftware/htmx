---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `include-vals` Extension

The `include-vals` extension allows you to programatically include values in a request with
a `include-vals` attribute.  The value of this attribute is one or more name/value pairs, which
will be evaluated as the fields in a javascript object literal.

### Usage

```html
<div hx-ext="include-vals">
    <!-- Removes this div after 1 second -->
    <div hx-get="/test" include-vals="included:true, computed: computeValue()">
      Will Include Additional Values
    </div>
</div> 
```

### Source

<https://unpkg.com/htmx.org/dist/ext/include-vals.js>

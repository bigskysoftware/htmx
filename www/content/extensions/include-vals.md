+++
title = "include-vals"
+++

The `include-vals` extension allows you to programmatically include values in a request with
a `include-vals` attribute.  The value of this attribute is one or more name/value pairs, which
will be evaluated as the fields in a javascript object literal.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/include-vals.js"></script>
```

## Usage

```html
<div hx-ext="include-vals">
    <div hx-get="/test" include-vals="included:true, computed: computeValue()">
      Will Include Additional Values
    </div>
</div>
```

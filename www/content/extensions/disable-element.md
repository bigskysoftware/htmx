+++
title = "disable-element"
+++

**NOTE: This extensions functionality has been folded into the core of htmx via the `hx-disabled-elt` attribute**

This extension disables an element during an htmx request, when configured on the element triggering the request.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/disable-element.js"></script>
```

## Usage

### Nominal case: disabling the element triggering the request
```html
<button hx-get="/whatever" hx-ext="disable-element" hx-disable-element="self">Click me</button>
```

### Disabling another element
```html
<button hx-get="/whatever" hx-ext="disable-element" hx-disable-element="#to-disable">Click me</button>
<button id="to-disable">Watch me being disabled</button>
```

### Disabling multiple elements
```html
<button hx-get="/whatever" hx-ext="disable-element" hx-disable-element=".to-disable">Click me</button>
<button class="to-disable">Watch me being disabled</button>
<button class="to-disable">Watch me being disabled also</button>
```

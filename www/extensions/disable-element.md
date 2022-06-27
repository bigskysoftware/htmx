---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `disable-element` Extension

This extension disables an element during an htmx request, when configured on the element triggering the request.

### Usage

#### Nominal case: disabling the element triggering the request
```html
<button hx-get="/whatever" hx-ext="disable-element" hx-disable-element="self">Click me</button>
```

#### Disabling another element
```html
<button hx-get="/whatever" hx-ext="disable-element" hx-disable-element="#to-disable">Click me</button>
<button id="to-disable">Watch me being disabled</button>
```

### Source

<https://unpkg.com/htmx.org/dist/ext/disable-element.js>

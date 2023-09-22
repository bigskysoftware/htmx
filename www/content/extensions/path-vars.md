---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `path-vars` Extension

This extension replaces variables in the request path - for example of `hx-get` - with
data from the triggering event.

### Install

```html
<script src="https://unpkg.com/htmx.org/dist/ext/path-vars.js">
```

### Usage

Assuming an event was triggered like

```
HX-Trigger: {"itemAdded":{"id" : "42"}}
```

Then its data can be used in requests

```html
<div hx-ext="path-vars" hx-get="/items/{event.id}" hx-trigger="itemAdded from:body" />
```

The request to the server is `/items/42`.

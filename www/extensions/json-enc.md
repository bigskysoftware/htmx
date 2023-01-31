---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `json-enc` Extension

This extension encodes parameters in JSON format instead of url format.

### Install

```html
<script src="https://unpkg.com/htmx.org/dist/ext/json-enc.js">
```

### Usage

```html
<div hx-post='/test' hx-ext='json-enc'>click me</div>
```

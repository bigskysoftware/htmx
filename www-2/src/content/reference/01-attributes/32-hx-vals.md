---
title: "hx-vals"
description: "Add values to request parameters"
---

Adds values to the parameters that will be submitted with the request.

## Syntax

```html
<div hx-get="/search" hx-vals='{"category": "books"}'>
  Search
</div>
```

## JSON Object

Provide a JSON object directly:

```html
<button hx-post="/api/user" hx-vals='{"role": "admin", "active": true}'>
  Create Admin
</button>
```

## JavaScript Expression

Use `js:` prefix to evaluate JavaScript:

```html
<div hx-get="/search" hx-vals='js:{query: document.querySelector("#search").value}'>
  Search
</div>
```

## Notes

* Values are added to the request body (POST, PUT, PATCH, DELETE) or query parameters (GET)
* If a value already exists in the form, `hx-vals` will override it
* The JavaScript expression is evaluated at request time
* Can return a Promise for async value resolution

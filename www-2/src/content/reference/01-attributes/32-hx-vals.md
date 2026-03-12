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

> **Security warning:** When using the `js:` prefix, be aware that you are introducing security considerations, especially when dealing with user input such as query strings or user-generated content, which could introduce a Cross-Site Scripting (XSS) vulnerability.

## The `:append` Modifier

By default, a child element's `hx-vals` declaration completely replaces the parent's value for any shared key. Use the `:append` modifier to merge the child's values into the parent's instead:

```html
<div hx-vals='{"category": "books", "lang": "en"}'>
  <!-- Replaces parent entirely for shared keys -->
  <button hx-get="/search" hx-vals='{"category": "fiction"}'>Fiction</button>

  <!-- Merges with parent, overriding only "category" -->
  <button hx-get="/search" hx-vals:append='{"category": "fiction"}'>Fiction</button>
</div>
```

## Inheritance

A child element's `hx-vals` declaration completely replaces the parent value for any key that appears in both. Use the `:append` modifier to merge the values instead of replacing them.

## Comparison with `hx-include`

- `hx-include` pulls values from existing input elements in the DOM
- `hx-vals` adds arbitrary static or computed values that don't correspond to a form element

Both attributes can be used together: `hx-include` captures input data while `hx-vals` supplies additional parameters.

## Notes

* Values are added to the request body (POST, PUT, PATCH, DELETE) or query parameters (GET)
* If a value already exists in the form, `hx-vals` will override it
* The JavaScript expression is evaluated at request time
* Can return a Promise for async value resolution

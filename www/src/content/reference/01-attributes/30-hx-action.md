---
title: "hx-action"
description: "Specifies the URL to receive the request"
---

The `hx-action` attribute specifies the URL that will receive the request. It mirrors the native `action` attribute on forms, making it familiar to HTML authors and enabling progressive enhancement.

## Syntax

```html
<button hx-action="/api/users" hx-method="post">
    Create User
</button>
```

## Progressive Enhancement

Like [`hx-boost`](/reference/attributes/hx-boost), `hx-action` supports progressive enhancement — the browser falls back to native `action`/`method` when JavaScript is unavailable. Where `hx-boost` provides page-navigation defaults (target body, scroll to top, push URL) for `<a>` and `<form>`, `hx-action` gives you full control over those behaviors and works on any element.

```html
<!-- Works natively AND with htmx -->
<form hx-action="/contacts" method="post" hx-target="#results">
    <input name="name" required>
    <button>Create Contact</button>
</form>
```

## Method Resolution

When `hx-action` is used without [`hx-method`](/reference/attributes/hx-method), htmx resolves the HTTP method using the same fallback chain browsers use:

1. [`hx-method`](/reference/attributes/hx-method) attribute on the element
2. `formmethod` attribute on the submitter button
3. Native `method` attribute on the form
4. Defaults to `GET`

This means submitter buttons with `formmethod` work as expected:

```html
<form hx-action="/contacts/123" method="get" hx-target="#detail">
    <button>View</button>
    <button formmethod="delete">Delete</button>
</form>
```

Clicking "View" sends a GET, clicking "Delete" sends a DELETE — matching native form semantics.

## When to Use

| Pattern | Use case |
|---------|----------|
| `hx-get`, `hx-post`, etc. | You know the method at authoring time and don't need native fallback |
| `hx-action` + `hx-method` | Method is dynamic (e.g. server-rendered) or you want a clear separation of URL and verb |
| `hx-action` alone | Progressive enhancement — method resolved from native `method`/`formmethod` attributes |
| `hx-boost` | Progressive enhancement with page-navigation defaults (target body, push URL) |

## Notes

* `hx-action` is typically used with [`hx-method`](/reference/attributes/hx-method) to specify both the URL and HTTP method
* The shorthand attributes like [`hx-get`](/reference/attributes/hx-get), [`hx-post`](/reference/attributes/hx-post), etc. combine both URL
  and method

## Examples

```html
<!-- Server-rendered dynamic method -->
<button hx-action="/api/users/123" hx-method="${method}">
    ${action_label}
</button>

<!-- Equivalent to hx-post shorthand -->
<button hx-action="/api/users" hx-method="post">
    Create User
</button>
<!-- same as -->
<button hx-post="/api/users">
    Create User
</button>
```

---
title: "hx-action"
description: "Specifies URL to receive request"
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

Unlike `hx-boost` (which always requests the same URL as the native `href`/`action`), `hx-action` can optionally point to a *different* URL. The recommended approach is still to detect htmx request headers and return fragments from the same URL, but in cases where separate endpoints are preferred, `hx-action` makes that possible:

```html
<form action="/contacts/new"               <!-- full page (no-JS fallback) -->
      hx-action="/fragments/contacts/new"  <!-- separate partial endpoint -->
      method="post"
      hx-target="#contact-list">
    <input name="name" required>
    <button>Create</button>
</form>
```

## Method Resolution

htmx resolves the HTTP method with this chain:

1. A shorthand attribute on the element ([`hx-get`](/reference/attributes/hx-get), [`hx-post`](/reference/attributes/hx-post), [`hx-put`](/reference/attributes/hx-put), [`hx-patch`](/reference/attributes/hx-patch), [`hx-delete`](/reference/attributes/hx-delete), [`hx-query`](/reference/attributes/hx-query))
2. [`hx-method`](/reference/attributes/hx-method) attribute on the element
3. `formmethod` attribute on the submitter button
4. Native `method` attribute on the form
5. Defaults to `GET`

A shorthand attribute sets the URL and the method together, so it wins over `hx-method`. `hx-action` supplies only the URL. If the element has `hx-action`, htmx does not read the shorthand attributes, and `hx-method` applies.

The remaining steps are the same fallback chain browsers use.

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
| `hx-action` alone | Progressive enhancement — method from native attributes, with option to use a separate AJAX endpoint |
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

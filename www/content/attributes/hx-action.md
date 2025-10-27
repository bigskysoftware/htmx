+++
title = "hx-action"
+++

The `hx-action` attribute specifies the URL that will receive the request.

## Syntax

```html
<button hx-action="/api/users" hx-method="post">
    Create User
</button>
```

## Notes

* `hx-action` is typically used with [`hx-method`](@/attributes/hx-method.md) to specify both the URL and HTTP method
* The shorthand attributes like [`hx-get`](@/attributes/hx-get.md), [`hx-post`](@/attributes/hx-post.md), etc. combine both URL and method
* Use `hx-action` + `hx-method` when you need dynamic method selection

## Examples

```html
<!-- Using hx-action with hx-method -->
<button hx-action="/api/users" hx-method="post">
    Create User
</button>

<!-- Equivalent using hx-post shorthand -->
<button hx-post="/api/users">
    Create User
</button>
```

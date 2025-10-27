+++
title = "hx-method"
+++

The `hx-method` attribute specifies the HTTP method (verb) to use for the request.

## Syntax

```html
<button hx-action="/api/users" hx-method="post">
    Create User
</button>
```

## Notes

* Valid values: `get`, `post`, `put`, `patch`, `delete`
* If no method is specified, defaults to `get`
* `hx-method` is typically used with [`hx-action`](@/attributes/hx-action.md)
* The shorthand attributes like [`hx-get`](@/attributes/hx-get.md), [`hx-post`](@/attributes/hx-post.md), etc. can be used instead

## Examples

```html
<!-- Explicit method specification -->
<button hx-action="/api/users/123" hx-method="delete">
    Delete User
</button>

<!-- Equivalent using hx-delete shorthand -->
<button hx-delete="/api/users/123">
    Delete User
</button>

<!-- Default to GET if no method specified -->
<button hx-action="/api/users">
    Get Users
</button>
```

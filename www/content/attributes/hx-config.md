+++
title = "hx-config"
+++

The `hx-config` attribute allows you to configure request behavior using JSON.

## Syntax

```html
<button hx-post="/api/users" hx-config='{"timeout": 5000}'>
    Create User
</button>
```

## Notes

* Accepts a JSON object with configuration options
* Can be used to override global configuration on a per-element basis
* TODO: Document specific config options available via hx-config

## Examples

```html
<button hx-post="/api/users" hx-config='{"timeout": 5000}'>
    Create User (5 second timeout)
</button>
```

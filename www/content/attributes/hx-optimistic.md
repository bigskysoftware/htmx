+++
title = "hx-optimistic"
+++

The `hx-optimistic` attribute allows you to show optimistic content while a request is in flight.

## Syntax

```html
<button hx-post="/like" hx-optimistic="true">
    Like
</button>
```

## Notes

* Optimistic content is swapped in immediately when the request is triggered
* If the request fails, the optimistic content is removed
* Useful for providing immediate feedback to users

## Examples

```html
<!-- TODO: Add comprehensive examples -->
<button hx-post="/like" hx-optimistic="true">
    Like
</button>
```

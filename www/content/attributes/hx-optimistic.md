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

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>Add comprehensive examples</p>
</aside>

```html
<button hx-post="/like" hx-optimistic="true">
    Like
</button>
```

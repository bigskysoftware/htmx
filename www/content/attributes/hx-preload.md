+++
title = "hx-preload"
+++

The `hx-preload` attribute allows you to preload a request on a trigger event.

## Syntax

```html
<a href="/page" hx-get="/page" hx-preload="mouseenter">
    Hover to Preload
</a>
```

## Notes

* Preloads the request before the main trigger fires
* Useful for improving perceived performance
* Can specify which event triggers the preload

## Examples

```html
<!-- Preload on mouse enter -->
<a href="/page" hx-get="/page" hx-preload="mouseenter">
    Hover to Preload
</a>
```

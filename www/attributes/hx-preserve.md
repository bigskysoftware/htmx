---
layout: layout.njk
title: </> htmx - hx-preserve
---

## `hx-preserve`

The `hx-preserve` attribute allows you to keep an element unchanged during HTML replacement.
Elements with `hx-preserve` set are preserved by `id` when htmx updates any ancestor element.
You *must* set an unchanging `id` on elements for `hx-preserve` to work.
The response requires an element with the same `id`, but its type and other attributes are ignored.

Here is an example of a youtube embed, which would be unaffected an htmx request:

```html
<div>
  <iframe hx-preserve='true' id='iframe1' width="1268" height="720" src="https://www.youtube.com/embed/Z1oB2EDu5XA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
```

### Notes

* `hx-preserve` is not inherited

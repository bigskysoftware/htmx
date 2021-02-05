---
layout: layout.njk
title: </> htmx - hx-preserve
---

## `hx-preserve`

The `hx-preserve` attribute allows you to keep a section of content unchanged between HTML replacement.  When hx-preserve is set to `true`, an element is preserved (by id) even if the surrounding HTML is updated by htmx.  An element *must* have an `id` to be preserved 
properly.

Here is an example of a youtube embed, which would be unaffected an htmx request:

```html
<div>
  <iframe hx-preserve='true' id='iframe1' width="1268" height="720" src="https://www.youtube.com/embed/Z1oB2EDu5XA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
```

### Notes

* `hx-preserve` is not inherited

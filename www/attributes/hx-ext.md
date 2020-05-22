---
layout: layout.njk
title: </> htmx - hx-ext
---

## `hx-ext`

The `hx-ext` attribute enables an htmx [extension](/extensions) for an element and all its children.

The value can be a single extension name or a comma separated list of extensions to apply.

The `hx-ext` tag may be placed on parent elements if you want a plugin to apply to an entire swath of the DOM,
and on the `body` tag for it to apply to all htmx requests.

### Notes

* `hx-ext` is both inherited and merged with parent elements, so you can specify extensions on any element in the DOM 
hierarchy and it will apply to all child elements. 

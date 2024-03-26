+++
title = "hx-ext"
+++

The `hx-ext` attribute enables an htmx [extension](https://extensions.htmx.org) for an element and all its children.

The value can be a single extension name or a comma separated list of extensions to apply.

The `hx-ext` tag may be placed on parent elements if you want a plugin to apply to an entire swath of the DOM,
and on the `body` tag for it to apply to all htmx requests.

## Notes

* `hx-ext` is both inherited and merged with parent elements, so you can specify extensions on any element in the DOM 
hierarchy and it will apply to all child elements. 

* You can ignore an extension that is defined by a parent node using `hx-ext="ignore:extensionName"` 


```html
<div hx-ext="example">
  "Example" extension is used in this part of the tree...
  <div hx-ext="ignore:example">
    ... but it will not be used in this part.
  </div>
</div>
```


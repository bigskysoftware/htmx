---
layout: layout.njk
title: </> kutty - kt-include
---

## `kt-include`

The `kt-include` attribute allows you to include additional data beyond the [standard](/docs/#forms)
values.

The value of this attribute is a CSS query selector of additional elements to include the values of.

```html
<button kt-post="/hidden" kt-include="#hidden-value">
  Get Some HTML, Including The Value of #hidden-value
</button>
```

In addition to the normal variables included with this request, the value of the element with the
id `hidden-value` will be included.

### Notes

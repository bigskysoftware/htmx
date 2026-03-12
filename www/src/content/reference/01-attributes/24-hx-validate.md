---
title: "hx-validate"
description: "Validate before submitting request"
---

The `hx-validate` attribute will cause an element to validate itself by way of
the [HTML5 Validation API](/docs.md#validation)
before it submits a request.

## Syntax

```html
<input hx-post="/submit" hx-validate="true">
```

Only `<form>` elements validate data by default, but other elements do not. Adding `hx-validate="true"` to `<input>`,
`<textarea>` or `<select>` enables validation before sending requests.

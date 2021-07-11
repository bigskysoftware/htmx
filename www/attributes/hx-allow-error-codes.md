---
layout: layout.njk
title: </> htmx - hx-allow-error-codes
---

## `hx-allow-error-codes`

The `hx-allow-error-codes` attribute allows error codes to be accepted from AJAX requests. This means that meaningful status codes can be used from ajax requests for errors and still use the same rendering behaviour as requests with success codes.

Here is an example:

```html
<div hx-allow-error-codes="true">
  <button hx-get="/login">
    Login
  </button>
</div>
```

### Notes

* `hx-allow-error-codes` is inherited and can be placed on a parent element

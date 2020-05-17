---
layout: layout.njk
title: </> htmx - hx-error-url
---

## `hx-error-url`

The `hx-error-url` attribute allows you to send client-side errors to a specified URL.  It is typically put on the
body tag, so all errors are caught and send to the server.

```html
<body hx-error-url="/errors">\

</body>
```
When a client side error is caught by htmx it will be `POST`-ed to the given URL, with the following JSON format:

```json
  { "elt": elt.id, "event": eventName, "detail" : detail }
```

### Notes

* `hx-error-url` is inherited and can be placed on a parent element

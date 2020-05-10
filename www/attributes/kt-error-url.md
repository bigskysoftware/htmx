---
layout: layout.njk
title: </> kutty - kt-error-url
---

## `kt-error-url`

The `kt-error-url` attribute allows you to send client-side errors to a specified URL.  It is typically put on the
body tag, so all errors are caught and send to the server.

```html
<body kt-error-url="/errors">\

</body>
```
When a client side error is caught by kutty it will be `POST`-ed to the given URL, with the following JSON format:

```json
  { "elt": elt.id, "event": eventName, "detail" : detail }
```

### Notes

* `kt-error-url` is inherited and can be placed on a parent element

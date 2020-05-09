---
layout: layout.njk
title: </> kutty - kt-post
---

## `kt-post`

The `kt-post` attribute will cause an element to issue a `POST` to the specified URL and swap
the HTML into the DOM using a swap strategy:

```html
<button kt-post="/account/enable" kt-target="body">
  Enable Your Account
</button>
```

This example will cause the `button` to issue a `POST` to `/account/enable` and swap the returned HTML into
 the `innerHTML` of the `body`.
 
### Notes

* You can control the target of the swap using the [kt-target](/attributes/kt-target) attribute
* You can control the swap strategy by using the [kt-swa](/attributes/kt-swap) attribute
* You can control what event triggers the request with the [kt-trigger](/attributes/kt-trigger) attribute
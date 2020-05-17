---
layout: layout.njk
title: </> htmx - hx-delete
---

## `hx-delete`

The `hx-delete` attribute will cause an element to issue a `DELETE` to the specified URL and swap
the HTML into the DOM using a swap strategy:

```html
<button hx-delete="/account" hx-target="body">
  Delete Your Account
</button>
```

This example will cause the `button` to issue a `DELETE` to `/account` and swap the returned HTML into
 the `innerHTML` of the `body`.
 
### Notes

* `hx-delete` is not inherited
* Since most browsers do not support issuing an actual `DELETE`, the request will actually be issued
  as a `POST`, with the [`X-HTTP-Method-Override`](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields) header set to `DELETE`.
* You can control the target of the swap using the [hx-target](/attributes/hx-target) attribute
* You can control the swap strategy by using the [hx-swap](/attributes/hx-swap) attribute
* You can control what event triggers the request with the [hx-trigger](/attributes/hx-trigger) attribute

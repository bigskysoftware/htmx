---
layout: layout.njk
title: </> htmx - hx-patch
---

## `hx-patch`

The `hx-patch` attribute will cause an element to issue a `PATCH` to the specified URL and swap
the HTML into the DOM using a swap strategy:

```html
<button hx-patch="/account" hx-target="body">
  Patch Your Account
</button>
```

This example will cause the `button` to issue a `PATCH` to `/account` and swap the returned HTML into
 the `innerHTML` of the `body`.
 
### Notes

* `hx-patch` is not inherited
* Since most browsers do not support issuing an actual `PATCH`, the request will actually be issued
  as a `POST`, with the [`X-HTTP-Method-Override`](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields) header set to `PATCH`.
* You can control the target of the swap using the [hx-target](/attributes/hx-target) attribute
* You can control the swap strategy by using the [hx-swap](/attributes/hx-swap) attribute
* You can control what event triggers the request with the [hx-trigger](/attributes/hx-trigger) attribute
* You can control the data submitted with the request in various ways, documented here: [Parameters](/docs/#parameters)
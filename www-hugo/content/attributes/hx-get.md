---
layout: layout.njk
title: </> htmx - hx-get
---

## `hx-get`

The `hx-get` attribute will cause an element to issue a `GET` to the specified URL and swap
the HTML into the DOM using a swap strategy:

```html
  <div hx-get="/example">Get Some HTML</div>
```

This example will cause the `div` to issue a `GET` to `/example` and swap the returned HTML into
 the `innerHTML` of the `div`.

### Notes

* `hx-get` is not inherited
* By default `hx-get` does not include any parameters.  You can use the [hx-params](/attributes/hx-params)
  attribute to change this
* You can control the target of the swap using the [hx-target](/attributes/hx-target) attribute
* You can control the swap strategy by using the [hx-swap](/attributes/hx-swap) attribute
* You can control what event triggers the request with the [hx-trigger](/attributes/hx-trigger) attribute
* You can control the data submitted with the request in various ways, documented here: [Parameters](/docs/#parameters)
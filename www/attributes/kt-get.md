---
layout: layout.njk
title: </> kutty - kt-get
---

## `kt-get`

The `kt-get` attribute will cause an element to issue a `GET` to the specified URL and swap
the HTML into the DOM using a swap strategy:

```html
  <div kt-get="/example">Get Some HTML</div>
```

This example will cause the `div` to issue a `GET` to `/example` and swap the returned HTML into
 the `innerHTML` of the `div`.

### Notes

* `kt-get` is not inherited
* By default `kt-get` does not include any parameters.  You can use the [kt-params](/attributes/kt-params)
  attribute to change this
* You can control the target of the swap using the [kt-target](/attributes/kt-target) attribute
* You can control the swap strategy by using the [kt-swa](/attributes/kt-swap) attribute
* You can control what event triggers the request with the [kt-trigger](/attributes/kt-trigger) attribute
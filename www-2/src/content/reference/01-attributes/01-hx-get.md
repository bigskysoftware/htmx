---
title: "hx-get"
description: "Issue GET request to specified URL"
---

The `hx-get` attribute will cause an element to issue a `GET` to the specified URL and swap
the HTML into the DOM using a swap strategy.

## Syntax

```html
<button hx-get="/example">Get Some HTML</button>
```

This example will cause the `button` to issue a `GET` to `/example` and swap the returned HTML into
the `innerHTML` of the `button`.

### Notes

* You can control the target of the swap using the [hx-target](/reference/attributes/hx-target) attribute
* You can control the swap strategy by using the [hx-swap](/reference/attributes/hx-swap) attribute
* You can control what event triggers the request with the [hx-trigger](/reference/attributes/hx-trigger) attribute
* You can control the data submitted with the request in various ways, documented
  here: [Parameters](/docs.md#parameters)
* An empty `hx-get:""` will make a get request to the current url and will swap the current HTML page 

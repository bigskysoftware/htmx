---
title: "hx-put"
description: "Issue PUT request to specified URL"
---

# hx-put

The `hx-put` attribute will cause an element to issue a `PUT` to the specified URL and swap
the HTML into the DOM using a swap strategy.

## Syntax

```html
<button hx-put="/account" hx-target="body">
  Put Money In Your Account
</button>
```

This example will cause the `button` to issue a `PUT` to `/account` and swap the returned HTML into
the `innerHTML` of the `body`.

## Notes

* You can control the target of the swap using the [hx-target](/reference/attributes/hx-target) attribute
* You can control the swap strategy by using the [hx-swap](/reference/attributes/hx-swap) attribute
* You can control what event triggers the request with the [hx-trigger](/reference/attributes/hx-trigger) attribute
* You can control the data submitted with the request in various ways, documented
  here: [Parameters](/docs.md#parameters)

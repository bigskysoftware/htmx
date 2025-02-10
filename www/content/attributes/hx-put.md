+++
title = "hx-put"
description = """\
  The hx-put attribute in htmx will cause an element to issue a PUT request to the specified URL and swap the returned \
  HTML into the DOM using a swap strategy."""
+++

The `hx-put` attribute will cause an element to issue a `PUT` to the specified URL and swap
the HTML into the DOM using a swap strategy:

```html
<button hx-put="/account" hx-target="body">
  Put Money In Your Account
</button>
```

This example will cause the `button` to issue a `PUT` to `/account` and swap the returned HTML into
 the `innerHTML` of the `body`.
 
## Notes

* `hx-put` is not inherited
* You can control the target of the swap using the [hx-target](@/attributes/hx-target.md) attribute
* You can control the swap strategy by using the [hx-swap](@/attributes/hx-swap.md) attribute
* You can control what event triggers the request with the [hx-trigger](@/attributes/hx-trigger.md) attribute
* You can control the data submitted with the request in various ways, documented here: [Parameters](@/docs.md#parameters)

+++
title = "hx-patch"
+++

The `hx-patch` attribute will cause an element to issue a `PATCH` to the specified URL and swap
the HTML into the DOM using a swap strategy:

```html
<button hx-patch="/account" hx-target="body">
  Patch Your Account
</button>
```

This example will cause the `button` to issue a `PATCH` to `/account` and swap the returned HTML into
 the `innerHTML` of the `body`.
 
## Notes

* `hx-patch` is not inherited
* You can control the target of the swap using the [hx-target](@/attributes/hx-target.md) attribute
* You can control the swap strategy by using the [hx-swap](@/attributes/hx-swap.md) attribute
* You can control what event triggers the request with the [hx-trigger](@/attributes/hx-trigger.md) attribute
* You can control the data submitted with the request in various ways, documented here: [Parameters](@/docs.md#parameters)

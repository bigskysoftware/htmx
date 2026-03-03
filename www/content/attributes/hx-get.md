+++
title = "hx-get"
description = """\
  The hx-get attribute in htmx will cause an element to issue a GET request to the specified URL and swap the returned \
  HTML into the DOM using a swap strategy."""
+++

The `hx-get` attribute will cause an element to issue a `GET` to the specified URL and swap
the HTML into the DOM using a swap strategy:

```html
  <button hx-get="/example">Get Some HTML</button>
```

This example will cause the `button` to issue a `GET` to `/example` and swap the returned HTML into
 the `innerHTML` of the `button`.

### Notes

* `hx-get` is not inherited
* By default `hx-get` usually does not include any parameters.  You can use the [hx-params](@/attributes/hx-params.md)
  attribute to change this
    * NB: If the element with the `hx-get` attribute also has a value, this will be included as a parameter unless explicitly removed
* You can control the target of the swap using the [hx-target](@/attributes/hx-target.md) attribute
* You can control the swap strategy by using the [hx-swap](@/attributes/hx-swap.md) attribute
* You can control what event triggers the request with the [hx-trigger](@/attributes/hx-trigger.md) attribute
* You can control the data submitted with the request in various ways, documented here: [Parameters](@/docs.md#parameters)
* An empty `hx-get:""` will make a get request to the current url and will swap the current HTML page 

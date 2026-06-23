+++
title = "hx-custom-verb"
description = """\
  The hx-custom-verb attribute in htmx will cause an element to issue a request with a custom verb \
  to the specified URL and swap the returned HTML into the DOM using a swap strategy."""
+++

The `hx-custom-verb-*` attribute in htmx will cause an element to issue a request with a custom verb
to the specified URL and swap the returned HTML into the DOM using a swap strategy:

```html
<script lang="js">htmx.config.customVerbs.push('reset_password')</script>
<button hx-custom-verb-reset_password="/me" hx-target="body">
  Reset my password
</button>
```

This example will cause the `button` to issue a `RESET_PASSWORD` to `/me` and swap the returned HTML into
 the `innerHTML` of the `body`.
 
## Notes

* `hx-custom-verb` is not inherited
* You have to allow the custom verb by adding it to the config `customVerbs` as show in the example
* You can control the target of the swap using the [hx-target](@/attributes/hx-target.md) attribute
* You can control the swap strategy by using the [hx-swap](@/attributes/hx-swap.md) attribute
* You can control what event triggers the request with the [hx-trigger](@/attributes/hx-trigger.md) attribute
* You can control the data submitted with the request in various ways, documented here: [Parameters](@/docs.md#parameters)

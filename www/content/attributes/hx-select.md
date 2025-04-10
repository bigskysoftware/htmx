+++
title = "hx-select"
description = "The hx-select attribute in htmx allows you to select the content you want swapped from a response."
+++

The `hx-select` attribute allows you to select the content you want swapped from a response.  The value of
this attribute is a CSS query selector of the element or elements to select from the response.

Here is an example that selects a subset of the response content:

```html
<div>
    <button hx-get="/info" hx-select="#info-detail" hx-swap="outerHTML">
        Get Info!
    </button>
</div>
```

So this button will issue a `GET` to `/info` and then select the element with the id `info-detail`,
which will replace the entire button in the DOM.

## Notes

* `hx-select` is inherited and can be placed on a parent element

---
layout: layout.njk
title: </> kutty - kt-target
---

## `kt-target`

The `kt-target` attribute allows you to target a different element for swapping than the one issuing the AJAX
request.  The value of this attribute can be:
 
 * a CSS query selector of the element to target
 * `this` which indicates that the element that the `ic-target` attribute is on is the target
 * `closest <CSS selector>` which will find the closest parent ancestor that matches the given CSS selector. 
    (e.g. `closest tr` will target the closest table row to the element)

Here is an example that targets a div:

```html
<div>
    <div id="response-div"></div>
    <button kt-post="/register" kt-target="#response-div" kt-swap="beforeEnd">
        Register!
    </button>
</div>
```

The response from the `/register` url will be appended to the `div` with the id `response-div`.

### Notes

* `kt-target` is inherited and can be placed on a parent element

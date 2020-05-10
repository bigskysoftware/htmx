---
layout: layout.njk
title: </> kutty - kt-target
---

## `kt-target`

The `kt-target` attribute allows you to target a different element than the one issuing the AJAX
request.  The value of this attribute is a CSS query selector of the element to target when swapping
new content into the DOM.

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

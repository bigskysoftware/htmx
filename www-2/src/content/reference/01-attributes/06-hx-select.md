---
title: "hx-select"
description: "Select content to swap from response"
---

# hx-select

The `hx-select` attribute allows you to select the content you want swapped from a response. The value of
this attribute is a CSS query selector of the element or elements to select from the response.

## Syntax

```html
<button hx-get="/page" hx-select="#content">Load Content</button>
```

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

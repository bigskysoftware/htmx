---
layout: layout.njk
title: </> htmx - hx-include
---

## `hx-include`

The `hx-include` attribute allows you to include additional element values in an AJAX request.  The value of
 this attribute is a CSS query selector of the element or elements to include in the query.

Here is an example that includes a separate input value:

```html
<div>
    <button hx-post="/register" hx-include="[name='email']">
        Register!
    </button>
    Enter email: <input name="email" type="email"/>
</div>
```

This is a little contrived as you would typically enclose both of these elements in a `form` and submit
the value automatically, but it demonstrates the concept.

Note that if you include a non-input element, all input elements enclosed in that element will be included.

### Notes

* `hx-include` is inherited and can be placed on a parent element

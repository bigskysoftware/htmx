---
layout: layout.njk
title: </> kutty - kt-include
---

## `kt-include`

The `kt-include` attribute allows you to include additional element values in an AJAX request.  The value of
 this attribute is a CSS query selector of the element or elements to include in the query.

Here is an example that includes a separate input value:

```html
<div>
    <button kt-post="/register" kt-include="[name='email']">
        Register!
    </button>
    Enter email: <input name="email" type="email"/>
</div>
```

This is a little contrived as you would typically enclose both of these elements in a `form` and submit
the value automatically, but it demonstrates the concept.

### Notes

* `kt-indicator` is inherited and can be placed on a parent element

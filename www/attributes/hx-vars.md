---
layout: layout.njk
title: </> htmx - hx-vars
---

## `hx-vars`

The `hx-vars` attribute allows you to dynamically add to the parameters that will be submitted with an AJAX request.  

The value of this attribute is a comma separated list of `name`:`<expression>` values, the same as the internal
syntax of javascript [Object Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Object_literals)

```html
  <div hx-get="/example" hx-vars="myVar:computeMyVar()">Get Some HTML, Including A Dynamic Value in the Request</div>
```

### Notes

* `hx-params` is inherited and can be placed on a parent element.
* A child declaration of a variable overrides a parent declaration.
* Input values with the same name override variable declarations.

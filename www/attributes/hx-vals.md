---
layout: layout.njk
title: </> htmx - hx-vals
---

## `hx-vals`

The `hx-vals` attribute allows you to safely add to the parameters that will be submitted with an AJAX request.  

The value of this attribute is a list of name-expression values in [JSON (JavaScript Object Notation)](https://www.json.org/json-en.html) format.

```html
  <div hx-get="/example" hx-vals='{"myVal": "My Value"}'>Get Some HTML, Including A Value in the Request</div>
```

### Security Considerations

* The value of `hx-vals` must be valid [JSON](https://developer.mozilla.org/en-US/docs/Glossary/JSON). It is **not** dynamically computed, making it a safer alternative to [hx-vars](/attributes/hx-vars), especially when dealing with user input such as query strings or user-generated content, which could otherwise introduce a [Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/) vulnerability. 

### Notes

* `hx-vals` is inherited and can be placed on a parent element.
* A child declaration of a variable overrides a parent declaration.
* Input values with the same name will be overridden by variable declarations.

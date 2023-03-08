+++
title = "hx-vars"
+++

**NOTE: `hx-vars` has been deprecated in favor of [`hx-vals`](@/attributes/hx-vals.md), which is safer by default.**

The `hx-vars` attribute allows you to dynamically add to the parameters that will be submitted with an AJAX request.  

The value of this attribute is a comma separated list of `name`:`<expression>` values, the same as the internal
syntax of javascript [Object Literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Object_literals).

```html
  <div hx-get="/example" hx-vars="myVar:computeMyVar()">Get Some HTML, Including A Dynamic Value in the Request</div>
```

## Security Considerations

* The expressions in `hx-vars` are dynamically computed which allows you to add JavaScript code that will be executed. Be careful to **never** trust user input in your expressions as this may lead to a [Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/) vulnerability. If you are dealing with user input such as query strings or user-generated content, consider using [hx-vals](@/attributes/hx-vals.md) which is a safer alternative.

## Notes

* `hx-vars` is inherited and can be placed on a parent element.
* A child declaration of a variable overrides a parent declaration.
* Input values with the same name will be overridden by variable declarations.

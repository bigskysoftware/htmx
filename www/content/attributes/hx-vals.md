+++
title = "hx-vals"
description = """\
  The hx-vals attribute in htmx allows you to add to the parameters that will be submitted with an AJAX request."""
+++

The `hx-vals` attribute allows you to add to the parameters that will be submitted with an AJAX request.

By default, the value of this attribute is a list of name-expression values in [JSON (JavaScript Object Notation)](https://www.json.org/json-en.html)
format.

If you wish for `hx-vals` to *evaluate* the values given, you can prefix the values with `javascript:` or `js:`.

```html
  <div hx-get="/example" hx-vals='{"myVal": "My Value"}'>Get Some HTML, Including A Value in the Request</div>

  <div hx-get="/example" hx-vals='js:{myVal: calculateValue()}'>Get Some HTML, Including a Dynamic Value from Javascript in the Request</div>
```

When using evaluated code you can access the `event` object. This example includes the value of the last typed key within the input.

```html
  <div hx-get="/example" hx-trigger="keyup" hx-vals='js:{lastKey: event.key}'>
    <input type="text" />
  </div>
```

You can also use the spread operator to dynamically specify values. This allows you to include all properties from an object returned by a function:

```html
  <div hx-get="/example" hx-vals='js:{...foo()}'>Get Some HTML, Including All Values from foo() in the Request</div>
```

In this example, if `foo()` returns an object like `{name: "John", age: 30}`, both `name` and `age` will be included as parameters in the request.

## Security Considerations

* By default, the value of `hx-vals` must be valid [JSON](https://developer.mozilla.org/en-US/docs/Glossary/JSON).
  It is **not** dynamically computed.  If you use the `javascript:` prefix, be aware that you are introducing
  security considerations, especially when dealing with user input such as query strings or user-generated content,
  which could introduce a [Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/) vulnerability.

## Notes

* `hx-vals` is inherited and can be placed on a parent element.
* A child declaration of a variable overrides a parent declaration.
* Input values with the same name will be overridden by variable declarations.
* When using `javascript:`, `this` refers to the element with the `hx-vals` attribute

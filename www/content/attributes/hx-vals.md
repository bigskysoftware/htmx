+++
title = "hx-vals"
description = "The hx-vals attribute in htmx allows you to add values dynamically to the request parameters."
+++

The `hx-vals` attribute allows you to add values dynamically to the parameters that will be submitted with an AJAX request.

By default, the value of this attribute is a list of name-value pairs in [JSON (JavaScript Object Notation)](https://www.json.org/json-en.html) format.

If you wish for `hx-vals` to *evaluate* the values given, you can prefix the values with `javascript:` or `js:`:

```html
<div hx-get="/example" hx-vals='{"myVal": "My Value"}'>Get Some HTML</div>

<div hx-get="/example" hx-vals='js:{myVal: calculateValue()}'>Get Some HTML</div>
```

When using evaluated code, the `hx-vals` code is evaluated as an expression that should return an object. The keys and values of that object will be added to the request parameters.

## Comparison with `hx-include`

While both `hx-vals` and [`hx-include`](@/attributes/hx-include.md) allow you to add data to a request:

* `hx-include` is used to include the values of other *input elements* in the DOM
* `hx-vals` is used to add *arbitrary values* (either static or dynamically computed)

They can be used together to combine values from existing inputs with additional computed or static values.

## Examples

### Static Values

Add a static value to the request:

```html
<button hx-post="/api/update"
        hx-vals='{"action": "save"}'>
    Save
</button>
```

### Dynamic JavaScript Values

Compute values dynamically using JavaScript:

```html
<button hx-post="/api/update"
        hx-vals='js:{timestamp: Date.now(), token: getAuthToken()}'>
    Update
</button>
```

### Combining with Form Data

Add extra values to a form submission:

```html
<form hx-post="/register" hx-vals='{"source": "landing-page"}'>
    <input name="email" type="email"/>
    <input name="password" type="password"/>
    <button type="submit">Register</button>
</form>
```

### Using with `hx-include`

Combine values from other inputs with computed values:

```html
<div>
    <input id="user-id" name="userId" type="hidden" value="123"/>
    <button hx-post="/action"
            hx-include="#user-id"
            hx-vals='js:{timestamp: Date.now()}'>
        Submit
    </button>
</div>
```

## Security Considerations

* By default, the value of `hx-vals` must be valid [JSON](https://developer.mozilla.org/en-US/docs/Glossary/JSON).
  It is **not** dynamically computed. If you use the `javascript:` or `js:` prefix, be aware that you are introducing
  security considerations, especially when dealing with user input such as query strings or user-generated content,
  which could introduce a [Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/) vulnerability.

## Notes

* A child declaration of a parameter name will override a parent declaration of the same name.
* Values from `hx-vals` are added to the request *after* values from the form and `hx-include`, so they can override those values.
* When using the `js:` prefix, the code has access to the htmx API methods as well as the element as `this`.
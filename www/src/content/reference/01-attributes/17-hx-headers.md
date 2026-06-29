---
title: "hx-headers"
description: "Adds custom headers to the request"
---

The `hx-headers` attribute allows you to add to the headers that will be submitted with an AJAX request.

By default, the value of this attribute is a list of name-expression values
in [JSON (JavaScript Object Notation)](https://www.json.org/json-en.html)
format.

## Syntax

```html
<div hx-get="/data" hx-headers='{"myHeader": "My Value"}'>Get Data</div>
```

If you wish for `hx-headers` to *evaluate* the values given, you can prefix the values with `javascript:` or `js:`.

```html
  <div hx-get="/example" hx-headers='{"myHeader": "My Value"}'>Get Some HTML, Including A Custom Header in the Request</div>

  <div hx-get="/example" hx-headers='js:{myVal: calculateValue()}'>Get Some HTML, Including a Dynamic Custom Header from Javascript in the Request</div>
```

## Inheritance

By default, `hx-headers` does not inherit to child elements. Use the `:inherited` modifier to apply headers to all htmx requests within a subtree. This is useful for propagating a CSRF token across a section of the page:

```html
<div hx-headers:inherited='js:{"X-CSRF-Token": getCsrfToken()}'>
  <button hx-post="/transfer">Submit</button>
  <button hx-delete="/item/1">Delete</button>
</div>
```

A child declaration of a header overrides a parent declaration.

## Security Considerations

* By default, the value of `hx-headers` must be valid [JSON](https://developer.mozilla.org/en-US/docs/Glossary/JSON).
  It is **not** dynamically computed. If you use the `javascript:` prefix, be aware that you are introducing
  security considerations, especially when dealing with user input such as query strings or user-generated content,
  which could introduce a [Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/) vulnerability.

* Whilst far from being a foolproof solution
  to [Cross-Site Request Forgery](https://owasp.org/www-community/attacks/csrf), the `hx-headers` attribute can support
  backend services to
  provide [CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
  For more information see the [CSRF Prevention](https://htmx.org/docs/#csrf-prevention) section.



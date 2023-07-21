+++
title = "hx-error-swap"
+++

By default, htmx ignores errors and doesn't swap content if the request isn't successful.
The `hx-error-swap` attribute allows you to specify how the response will be swapped in relative to the
[target](@/attributes/hx-target.md) of an AJAX request resulting in an error.

This attribute uses the same syntax as [hx-swap](@/attributes/hx-swap.md) and is used to specify a different swap
method in case of error. `hx-error-swap` supports the following additional value:
* `mirror` which will swap errors using the same swap specification as the one defined by `hx-swap` on the element,
  or the closest parent defining it, or fallback to the [default swap style](@/api.md#config)

Here is an example that targets a div:

```html
<div>
    <div id="response-div"></div>
    <button hx-post="/register" hx-target="#response-div" hx-swap="beforeend" hx-error-target="outerHTML">
        Register!
    </button>
</div>
```

If the request is successful, the response from the `/register` url will be appended to the `div` with the id `response-div`.
Otherwise, the error response from the `/register` url will replace that same `div` entirely.
As no [`hx-error-target`](@/attributes/hx-error-target.md) is defined here, the swap target is the same for both.

You may use [`hx-error-target`](@/attributes/hx-error-target.md) and `hx-error-swap` together to specify a 
different target and swap specifications:
```html
<div>
    <div id="response-div"></div>
    <button hx-post="/register" hx-target="#response-div" hx-swap="beforeend" hx-error-target="#error-div" hx-error-swap="innerHTML">
        Register!
    </button>
    <div id="error-div"></div>
</div>
```
If the request is successful, the response from the `/register` url will be appended to the `div` with the id `response-div`.
Otherwise, the error response from the `/register` url will replace the content of the `div` with the id `error-div`.

This example uses `hx-error-target="mirror"` to enable errors swapping, and swap them just as any regular response:
```html
<div>
  <div id="response-div"></div>
  <button hx-post="/register" hx-target="#response-div" hx-swap="beforeend" hx-error-target="mirror">
    Register!
  </button>
</div>
```
Whether the request is successful or not, the response from the `/register` url will be appended to the `div` with
the id `response-div`.

## Notes

* `hx-error-swap` is inherited and can be placed on a parent element
* The default value of this attribute is `innerHTML`
* Due to DOM limitations, it’s not possible to use the `outerHTML` method on the `<body>` element.
  htmx will change `outerHTML` on `<body>` to use `innerHTML`.
* The default swap delay is 0ms
* The default settle delay is 20ms

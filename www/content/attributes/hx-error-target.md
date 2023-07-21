+++
title = "hx-error-target"
+++

By default, htmx ignores errors and doesn't swap content if the request isn't successful. 
The `hx-error-target` attribute allows you to target an element for swapping in case the request results in an error.

This attribute uses the same syntax as [hx-target](@/attributes/hx-target.md) and is used to specify a different swap
target in case of error. `hx-error-target` supports the following additional value:
* `mirror` which will swap errors using the same target specification as the one defined by `hx-target` on the element,
  or the closest parent defining it

Here is an example that targets a div:

```html
<div>
    <div id="response-div"></div>
    <button hx-post="/register" hx-target="#response-div" hx-swap="beforeend" hx-error-target="#error-div">
        Register!
    </button>
    <div id="error-div"></div>
</div>
```

If the request is successful, the response from the `/register` url will be appended to the `div` with the id `response-div`.
Otherwise, the error response from the `/register` url will be appended to the `div` with the id `error-div`.
As no [`hx-error-swap`](@/attributes/hx-error-swap.md) is defined here, the swapping method is the same for both.

You may use `hx-error-target` and [`hx-error-swap`](@/attributes/hx-error-swap.md) together to specify a 
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

* `hx-error-target` is inherited and can be placed on a parent element

+++
title = "response-targets"
+++

This extension allows to specify different target elements to be swapped when
different HTTP response codes are received.

It uses attribute names in a form of ``hx-target-[CODE]`` where `[CODE]` is a numeric
HTTP response code with the optional wildcard character at its end.

The value of each attribute can be:

* A CSS query selector of the element to target.
* `this` which indicates that the element that the `hx-target` attribute is on is the target.
* `closest <CSS selector>` which will find the closest parent ancestor that matches the given CSS selector
  (e.g. `closest tr` will target the closest table row to the element).
* `find <CSS selector>` which will find the first child descendant element that matches the given CSS selector.
* `next <CSS selector>` which will scan the DOM forward for the first element that matches the given CSS selector.
  (e.g. `next .error` will target the closest following sibling element with `error` class)
* `previous <CSS selector>` which will scan the DOM backwards for the first element that matches the given CSS selector.
  (e.g `previous .error` will target the closest previous sibling with `error` class)

## Install

```html
<script src="https://unpkg.com/htmx.org/dist/ext/response-targets.js"></script>
```

## Configure (optional)

`isError` flag on the `detail` member of an event associated with swapping the
content with `hx-target-[CODE]` will be set to `false` when error response code is
received. This is different from the default behavior.

You may change this by setting a configuration flag
`htmx.config.responseTargetUnsetsError` to `false` (default is `true`).

`isError` flag on the `detail` member of an event associated with swapping the
content with `hx-target-[CODE]` will be set to `false` when non-erroneous response
code is received. This is no different from the default behavior.

You may change this by setting a configuration flag
`htmx.config.responseTargetSetsError` to `true` (default is `false`). This setting
will not affect the response code 200 since it is not handled by this extension.

## Usage

Here is an example that targets a `div` for normal (200) response but another `div`
for 404 (not found) response, and yet another for all 5xx response codes:

```html
<div hx-ext="response-targets">
    <div id="response-div"></div>
    <button hx-post="/register"
            hx-target="#response-div"
            hx-target-5*="#serious-errors"
            hx-target-404="#not-found">
        Register!
    </button>
    <div id="serious-errors"></div>
    <div id="not-found"></div>
</div>
```

* The response from the `/register` URL will replace contents of the `div` with the
  `id` `response-div` when response code is 200 (OK).

* The response from the `/register` URL will replace contents of the `div` with the `id`
  `serious-errors` when response code begins with a digit 5 (server errors).

* The response from the `/register` URL will will replace contents of the `div` with
  the `id` `not-found` when response code is 404 (Not Found).

## Wildcard resolution

When status response code does not match existing `hx-target-[CODE]` attribute name
then its numeric part expressed as a string is trimmed with last character being
replaced with the asterisk (`*`). This lookup process continues until the attribute
is found or there are no more digits.

For example, if a browser receives 404 error code, the following attribute names will
be looked up (in the given order):

* `hx-target-404`
* `hx-target-40*`
* `hx-target-4*`
* `hx-target-*`.

## Notes

* `hx-target-…` is inherited and can be placed on a parent element.
* `hx-target-…` cannot be used to handle HTTP response code 200.
* To avoid surprises the `hx-ext` attribute used to enable this extension should be
  placed on a parent element containing elements with `hx-target-…` and `hx-target`
  attributes.

## See also

* [`hx-target`](@/attributes/hx-target.md), specifies the target element to be swapped

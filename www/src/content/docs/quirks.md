---
title: "htmx quirks"
description: "Caveats and gotchas, in the spirit of SQLite's quirks page."
---

This is a "quirks" page, based on [SQLite's "Quirks, Caveats, and Gotchas In SQLite" page](https://www.sqlite.org/quirks.html).

## The Default Swap Strategy is `innerHTML`

The [`hx-swap`](/reference/attributes/hx-swap) attribute allows you to control how a swap is performed.  The default strategy is
`innerHTML`, that is, to place the response HTML content within the target element.

Many people prefer to use the `outerHTML` strategy as the default instead.

You can change this behavior using the `htmx.config.defaultSwapStyle`
[configuration variable](/docs#configuration).

Here is a `meta` tag configuration that does so:

```html
  <meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

## Targeting the `body` Always Performs an innerHTML Swap

For historical reasons, if you target the `body` element, htmx will
[always perform an `innerHTML` swap](https://github.com/bigskysoftware/htmx/blob/fb78106dc6ef20d3dfa7e54aca20408c4e4336fc/src/htmx.js#L1696).

This means you cannot change attributes on the `body` tag via an htmx request.

## By Default `4xx` & `5xx` Responses Do Not Swap

htmx has never swapped "error" status response codes (`400`s & `500`s) by default.

This behavior annoys some people, and some server frameworks, in particular, will return a `422 - Unprocessable Entity`
response code to indicate that a form was not filled out properly.

This can be very confusing when it is first encountered.

You can configure the response behavior of htmx via the [`htmx:beforeSwap`](/docs#client-side-scripting)
event or [via the `htmx.config.responseHandling` config array](https://htmx.org/docs/#response-handling).

Here is the default configuration:

```json
{
  "responseHandling": [
    {"code":"204", "swap": false},
    {"code":"[23]..", "swap": true},
    {"code":"[45]..", "swap": false, "error":true},
    {"code":"...", "swap": false}]
}
```

Note that `204  No Content` also is not swapped.

If you want to swap everything regardless of response code, you can use this configuration:

```json
{
  "responseHandling": [
    {"code":"...", "swap": true}]
}
```

If you want to specifically allow `422` responses to swap, you can use this configuration:

```json
{
  "responseHandling": [
    {"code":"422", "swap": true},
    {"code":"204", "swap": false},
    {"code":"[23]..", "swap": true},
    {"code":"[45]..", "swap": false, "error":true},
    {"code":"...", "swap": false}]
}
```

Here is a meta tag allowing all responses to swap:

```html
  <meta name="htmx-config" content='{"responseHandling": [{"code":"...", "swap": true}]}'>
```

## `GET` Requests on Non-Form Elements Do Not Include Form Values by Default

If a non-form element makes a non-`GET` request (e.g. a `PUT` request) via htmx, the values of the enclosing form
of that element (if any) [will be included in the request](/docs#input-values).

However, if the element issues a `GET`, the values of an enclosing form will
[not be included.](https://github.com/bigskysoftware/htmx/blob/fb78106dc6ef20d3dfa7e54aca20408c4e4336fc/src/htmx.js#L3525)

If you wish to include the values of the enclosing form when issuing an `GET` you can use the
[`hx-include`](/reference/attributes/hx-include) attribute like so:

```html
<button hx-get="/search"
        hx-include="closest form">
  Search
</button>
```

## Some People Don't Like `hx-boost`

[`hx-boost`](/reference/attributes/hx-boost) is an odd feature compared with most other aspects of htmx: it "magically" turns
all anchor tags and forms into AJAX requests.

This can speed the feel of these interactions up, and also allows the forms and anchors to continue working when
[JavaScript is disabled](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), however it comes
with some tradeoffs:

* The history issues mentioned above can show up
* Only the body of the web page will be updated, so any styles and scripts in the new page `head` tag will be discarded
* The global javascript scope is not refreshed, so it is possible to have strange interactions between pages.  For example
  a global `let` may start failing because a symbol is already defined.

Some members on the core htmx team feel that, due to these issues, as well as the fact that browsers have improved
quite a bit in page navigation, it is best to avoid `hx-boost` and
[just use unboosted links and forms](https://unplannedobsolescence.com/blog/less-htmx-is-more/).

There is no doubt that `hx-boost` is an odd-man out when compared to other htmx attributes and suffers from the dictum
that "If something magically works, then it can also magically break."

Despite this fact, I (Carson) still feel it is useful in many situations, and it is used on the <https://htmx.org>
website.

## Loading htmx asynchronously is unreliable

htmx is designed to be loaded with a standard, blocking `<script>` tag, not one that is a [module](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script#module) or [deferred](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script#defer).
Although we make a [best-effort attempt](https://github.com/bigskysoftware/htmx/blob/7ae66f9b33a5d39ad4084b0697ea34a6bf559cda/src/htmx.js#L5039-L5058) to initialize htmx regardless of when in the document lifecycle the script is loaded, there are some use-cases that slip through the cracks, typically ones that involve bundling or AJAX insertion of htmx itself.

Our [past attempts](https://github.com/bigskysoftware/htmx/pull/3365#issuecomment-3065080028) to close this gap have all lead to unacceptable regressions.
Therefore, although htmx can be loaded asynchronously, do so at your own risk.

Keep in mind, also, that if your DOM content loads before htmx does, all the htmx-provided functionality will be nonfunctional until htmx loads.
[Prefetching](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/prefetch) (or even "regular" fetching) htmx before you need it is one possible way to resolve this problem.

## The JavaScript API Is Not A Focus

htmx is a hypermedia-oriented front end library.  This means that htmx enhances HTML via
[attributes](/reference/attributes) in the HTML , rather than providing an elaborate
JavaScript API.

There _is_ a [JavaScript API](/reference/methods), but it is not a focus of the library and, in most cases,
should not be used heavily by htmx end users.

If you find yourself using it heavily, especially the [`htmx.ajax()`](/reference/methods/htmx-ajax) method, it may be
worth asking yourself if there is a more htmx-ish approach to achieve what you are doing.

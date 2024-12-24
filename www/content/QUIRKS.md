+++
title = "htmx quirks"
date = 2024-12-23
updated = 2024-12-23
[taxonomies]
author = ["Carson Gross"]
tag = ["posts"]
+++

This is a "quirks" page, based on [SQLite's "Quirks, Caveats, and Gotchas In SQLite](https://www.sqlite.org/quirks.html).

## Attribute Inheritance

Many attributes in htmx are [inherited](/@docs#inheritance): child elements can receive behavior from attributes located 
on parent elements.

As an example, here are two htmx-powered buttons that inherit their [target](@/attributes/hx-target.md) from a parent 
div:

```html
<div hx-target="#output">
    <button hx-post="/items/100/like">Like</button>
    <button hx-delete="/items/100">Delete</button>
</div>
<output id="output"></output>
```

This helps avoid repeating attributes, thus keeping code [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).
On the other hand, as the attributes get further away elements, you lose [Locality of Behavior](@/essays/locality-of-behaviour.md)
and it becomes more difficult to understand what an element is doing.

It is also possible to inadvertently change the behavior of elements by adding attributes to parents.

Some people prefer to disable inheritance in htmx entirely, using the `htmx.config.disableInheritance` 
[configuration variable](/@docs.md#config).  

Here is a `meta` tag configuration that does so:

```html
  <meta name="htmx-config" content='{"disableInheritance":true}'>
```

## The Default Swap Strategy is `innerHTML`

The [target](@/attributes/hx-swap.md) attribute allows you to control how a swap is performed.  The default strategy is
`innerHTML`, that is, to place the response HTML content within the target element.  Many people prefer to use the 
`outerHTML` strategy as the default instead.

You can change this behavior using the `htmx.config.defaultSwapStyle` 
[configuration variable](/@docs.md#config).  Here is a `meta` tag configuration that does so:

```html
  <meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

## Targeting the `body` Always Performs an innerHTML Swap

For historical reasons, if you target the `body` element, htmx will always perform an `innerHTML` swap.  This means you
cannot change attributes on the `body` tag via an htmx request.

## By Default `4xx` & `5xx` Responses Do Not Swap

htmx has never swapped "error" status response codes by default.  This behavior annoys some people, and some server
frameworks, in particular, will return a `422 - Unprocessable Entity` response code to indicate that a form was not 
filled out properly.  This can be very confusing when it is first encountered.

You can configure the response behavior of htmx via the `` event or 
[via the `htmx.config.responseHandling` config array]https://htmx.org/docs/#response-handling.

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
  <meta name="htmx-config" content='{"responseHandling": [{"code":"...", "swap": true}]'>
```

## History Can Be Tricky

htmx provides support for interacting with the broswer's [history](@/docs.md#history).  This can be very powerful, but it
can also be tricky, particularly if you are using 3rd party JavaScript libraries that modify the DOM.

There can also be [security concerns](@/docs.md#hx-history) when using htmx's history support.

Most of these issues can be solved by disabling any local history cache and simply issuing a server request when a 
user navigates backwards in history, with the tradeoff that history navigation will be slower.

Here is a meta tag that disables history caching:

```html
  <meta name="htmx-config" content='{"historyCacheSize": 0}'>
```

## Some People Don't Like `hx-boost`

[`hx-boost`](@/attributes/hx-boost.md) is an odd feature compared with most other aspects of htmx: it "magically" turns
all anchor tags and forms into AJAX requests.

This can speed the feel of these interactions up, and also continue working when JavaScript is disabled, however it comes
with some tradeoffs:

* The history issues mentioned above can show up
* Only the body of the web page will be updated, so any styles and scripts in the new page `head` tag will be discarded
* The global javascript scope is not refreshed, so it is possible to have strange interactions between pages.  For example
  a global `let` may start failing because a symbol is already defined.

Some members on the core htmx team feel that, due to these issues, as well as the fact that browsers have improved 
quite a bit in page navigation, it is best to avoid `hx-boost` and just use unboosted links and forms.

There is no doubt that `hx-boost` is an odd-man out when compared to other htmx attributes and suffers from the dictum
that "If something magically works, then it can also magically break."  Despite this fact, I (Carson) still feel it is
useful in many situations, and it is used on the <https://htmx.org> website

## The JavaScript API Is Not A Focus

htmx is a hypermedia-oriented front end library.  This means that htmx enhances HTML via 
[attributes](@/reference.md#attributes) in the HTML , rather than providing an elaborate
JavaScript API.

There _is_ a [JavaScript API](@/reference.md#api), but it is not a focus of the library and, in most cases,
should not be used heavily by htmx end users.  If you find yourself using it heavily, especially the `htmx.ajax()` method,
it may be worth asking yourself if there is a more htmx-ish way to achieve what you are doing.

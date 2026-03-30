---
title: "Requests & Responses"
description: "Work with HTTP headers and response status codes"
keywords: ["status code", "error handling", "response", "request", "AJAX", "XHR", "fetch"]
---

Htmx expects responses to the AJAX requests it makes to be HTML, typically HTML fragments (although a full HTML
document, matched with a [`hx-select`](/reference/attributes/hx-select) tag can be useful too).

Htmx will then swap the returned HTML into the document at the target specified and with the swap strategy specified.

Sometimes you might want to do nothing in the swap, but still perhaps trigger a client side
event ([see below](#response-headers)).

For this situation, by default, you can return a `204 - No Content` response code, and htmx will ignore the content of
the response.

In the event of a connection error, the [`htmx:error`](/reference/events/htmx-error) event will be triggered.

### Configuring Response Handling 

By default, htmx will swap content for all HTTP responses except `204` and `304` status codes. This includes error
responses (4xx, 5xx). You can customize this behavior using the [`hx-status`](/reference/attributes/hx-status) attribute pattern (`hx-status:XXX`) or by configuring
`htmx.config.noSwap`.

#### Status-Code Conditional Swapping

The `hx-status:XXX` attribute allows you to specify different swap behaviors based on the HTTP status code of the
response.
This gives you fine-grained control over how different response statuses are handled.

```html
<button hx-get="/data"
        hx-status:404="none"
        hx-status:500="target:#error-container">
    Load Data
</button>
```

```html
<form hx-post="/submit"
      hx-target="#result"
      hx-status:422="target:#validation-errors"
      hx-status:500="target:#server-error"
      hx-status:503="none">
    <input name="email">
    <button type="submit">Submit</button>
</form>

<div id="result"></div>
<div id="validation-errors"></div>
<div id="server-error"></div>
```

In this example:

- Successful responses (2xx) swap into `#result` (default behavior)
- `422` responses swap into `#validation-errors`
- `500` responses swap into `#server-error`
- `503` responses don't swap at all

### Request Headers

htmx includes headers in the requests it makes:

| Header                       | Description                                                                                          |
|------------------------------|------------------------------------------------------------------------------------------------------|
| [`HX-Boosted`](/reference/headers/HX-Boosted)                 | indicates that the request is via an element using [`hx-boost`](/reference/attributes/hx-boost)                  |
| [`HX-Current-URL`](/reference/headers/HX-Current-URL)             | the current URL of the browser                                                                       |
| [`HX-Request`](/reference/headers/HX-Request)                 | always "true"                                                                                        |
| [`HX-Request-Type`](/reference/headers/HX-Request-Type)            | `"partial"` for targeted swaps, `"full"` for body-level or `hx-select` requests                      |
| [`HX-Source`](/reference/headers/HX-Source)                  | the source element in `tag#id` format (e.g. `button#submit`)                                         |
| [`HX-Target`](/reference/headers/HX-Target)                  | the target element in `tag#id` format (e.g. `div#results`)                                           |

### Response Headers

htmx supports htmx-specific response headers:

| Header                                           | Description                                                                                                                                                                        |
|--------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`HX-Location`](/reference/headers/HX-Location)            | allows you to do a client-side redirect that does not do a full page reload                                                                                                        |
| [`HX-Push-Url`](/reference/headers/HX-Push-Url)            | pushes a new url into the history stack                                                                                                                                            |
| [`HX-Redirect`](/reference/headers/HX-Redirect)            | can be used to do a client-side redirect to a new location                                                                                                                         |
| [`HX-Refresh`](/reference/headers/HX-Refresh)                                     | if set to "true" the client-side will do a full refresh of the page                                                                                                                |
| [`HX-Replace-Url`](/reference/headers/HX-Replace-Url)      | replaces the current URL in the location bar                                                                                                                                       |
| `HX-Reswap`                                      | allows you to specify how the response will be swapped. See [`hx-swap`](/reference/attributes/hx-swap) for possible values                                                                     |
| `HX-Retarget`                                    | a CSS selector that updates the target of the content update to a different element on the page                                                                                    |
| `HX-Reselect`                                    | a CSS selector that allows you to choose which part of the response is used to be swapped in. Overrides an existing [`hx-select`](/reference/attributes/hx-select) on the triggering element |
| [`HX-Trigger`](/reference/headers/HX-Trigger)              | allows you to trigger client-side events                                                                                                                                           |

For more on the `HX-Trigger` headers, see [`HX-Trigger` Response Headers](/reference/headers/HX-Trigger).

Submitting a form via htmx has the benefit of no longer needing
the [Post/Redirect/Get Pattern](https://en.wikipedia.org/wiki/Post/Redirect/Get).
After successfully processing a POST request on the server, you don't need to return
a [HTTP 302 (Redirect)](https://en.wikipedia.org/wiki/HTTP_302). You can directly return the new HTML fragment.

Also, the response headers above are not provided to htmx for processing with 3xx Redirect response codes
like [HTTP 302 (Redirect)](https://en.wikipedia.org/wiki/HTTP_302). Instead, the browser will intercept the redirection
internally and return the headers and response from the redirected URL. Where possible use alternative response codes
like `200` to allow returning of these response headers.

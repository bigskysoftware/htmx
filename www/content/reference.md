+++
title = "Reference"
+++

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>These docs are NOT up to date with the htmx 4.0 changes and are in flux! See <a href="/htmx-4">changes in htmx 4.0</a>
</p>
</aside>

<details id="contents">
<summary><strong>Contents</strong></summary>

* [htmx Core Attributes](#attributes)
* [htmx Additional Attributes](#attributes-additional)
* [htmx CSS Classes](#classes)
* [htmx Request Headers](#request_headers)
* [htmx Response Headers](#response_headers)
* [htmx Events](#events)
* [htmx Extensions](/extensions)
* [JavaScript API](#api)
* [Configuration Options](#config)

</details>

## Core Attribute Reference {#attributes}

The most common attributes when using htmx.

<div class="info-table">

| Attribute                                    | Description                                                                                   |
|----------------------------------------------|-----------------------------------------------------------------------------------------------|
| [`hx-get`](@/attributes/hx-get.md)           | issues a `GET` to the specified URL                                                           |
| [`hx-post`](@/attributes/hx-post.md)         | issues a `POST` to the specified URL                                                          |
| [`hx-on*`](@/attributes/hx-on.md)            | handle events with inline scripts on elements                                                 |
| [`hx-push-url`](@/attributes/hx-push-url.md) | push a URL into the browser location bar to create history                                    |
| [`hx-select`](@/attributes/hx-select.md)     | select content to swap in from a response                                                     |
| [`hx-swap`](@/attributes/hx-swap.md)         | controls how content will swap in (`outerHTML`, `innerHTML`, `beforeend`, `afterend`, ...)    |
| [`hx-swap-oob`](@/attributes/hx-swap-oob.md) | mark element to swap in from a response (out of band)                                         |
| [`hx-target`](@/attributes/hx-target.md)     | specifies the target element to be swapped                                                    |
| [`hx-trigger`](@/attributes/hx-trigger.md)   | specifies the event that triggers the request                                                 |

</div>

## Additional Attribute Reference {#attributes-additional}

All other attributes available in htmx.

<div class="info-table">

| Attribute                                          | Description                                                                                                  |
|----------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| [`hx-action`](@/attributes/hx-action.md)     | specifies the URL to issue the request to                                                     |
| [`hx-boost`](@/attributes/hx-boost.md)             | add [progressive enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement) for links and forms     |
| [`hx-config`](@/attributes/hx-config.md)           | configure request behavior with JSON                                                                         |
| [`hx-confirm`](@/attributes/hx-confirm.md)         | shows a `confirm()` dialog or runs async confirmation before issuing a request                               |
| [`hx-delete`](@/attributes/hx-delete.md)           | issues a `DELETE` to the specified URL                                                                       |
| [`hx-disable`](@/attributes/hx-disable.md)         | adds the `disabled` attribute to the specified elements while a request is in flight                         |
| [`hx-encoding`](@/attributes/hx-encoding.md)       | changes the request encoding type                                                                            |
| [`hx-headers`](@/attributes/hx-headers.md)         | adds to the headers that will be submitted with the request                                                  |
| [`hx-ignore`](@/attributes/hx-ignore.md)           | disables htmx processing for the given node and any children nodes                                           |
| [`hx-include`](@/attributes/hx-include.md)         | include additional data in requests                                                                          |
| [`hx-indicator`](@/attributes/hx-indicator.md)     | the element to put the `htmx-request` class on during the request                                            |
| [`hx-method`](@/attributes/hx-method.md)     | specifies the HTTP method to use                                                              |
| [`hx-optimistic`](@/attributes/hx-optimistic.md)   | show optimistic content while request is in flight                                                           |
| [`hx-patch`](@/attributes/hx-patch.md)             | issues a `PATCH` to the specified URL                                                                        |
| [`hx-preload`](@/attributes/hx-preload.md)         | preload a request on a trigger event                                                                         |
| [`hx-preserve`](@/attributes/hx-preserve.md)       | specifies elements to keep unchanged between requests                                                        |
| [`hx-put`](@/attributes/hx-put.md)                 | issues a `PUT` to the specified URL                                                                          |
| [`hx-replace-url`](@/attributes/hx-replace-url.md) | replace the URL in the browser location bar                                                                  |
| [`hx-sync`](@/attributes/hx-sync.md)               | control how requests made by different elements are synchronized                                             |
| [`hx-validate`](@/attributes/hx-validate.md)       | force elements to validate themselves before a request                                                       |

</div>

## CSS Class Reference {#classes}

<div class="info-table">

| Class | Description |
|-----------|-------------|
| `htmx-added` | Applied to a new piece of content before it is swapped, removed after it is settled.
| `htmx-indicator` | A dynamically generated class that will toggle visible (opacity:1) when a `htmx-request` class is present
| `htmx-request` | Applied to either the element or the element specified with [`hx-indicator`](@/attributes/hx-indicator.md) while a request is ongoing
| `htmx-settling` | Applied to a target after content is swapped, removed after it is settled. The duration can be modified via [`hx-swap`](@/attributes/hx-swap.md).
| `htmx-swapping` | Applied to a target before any content is swapped, removed after it is swapped. The duration can be modified via [`hx-swap`](@/attributes/hx-swap.md).

</div>

## HTTP Header Reference {#headers}

### Request Headers Reference {#request_headers}

<div class="info-table">

| Header | Description |
|--------|-------------|
| `HX-Boosted` | indicates that the request is via an element using [hx-boost](@/attributes/hx-boost.md)
| `HX-History-Restore-Request` | "true" if the request is for history restoration
| `HX-Request` | always "true" for htmx-initiated requests

</div>

### Response Headers Reference {#response_headers}

<div class="info-table">

| Header                                               | Description |
|------------------------------------------------------|-------------|
| [`HX-Location`](@/headers/hx-location.md)            | allows you to do a client-side redirect that does not do a full page reload
| [`HX-Push-Url`](@/headers/hx-push-url.md)            | pushes a new url into the history stack
| [`HX-Redirect`](@/headers/hx-redirect.md)            | can be used to do a client-side redirect to a new location
| `HX-Refresh`                                         | if set to "true" the client-side will do a full refresh of the page
| [`HX-Replace-Url`](@/headers/hx-replace-url.md)      | replaces the current URL in the location bar
| `HX-Reswap`                                          | allows you to specify how the response will be swapped. See [hx-swap](@/attributes/hx-swap.md) for possible values
| `HX-Retarget`                                        | a CSS selector that updates the target of the content update to a different element on the page
| `HX-Reselect`                                        | a CSS selector that allows you to choose which part of the response is used to be swapped in. Overrides an existing [`hx-select`](@/attributes/hx-select.md) on the triggering element
| [`HX-Trigger`](@/headers/hx-trigger.md)              | allows you to trigger client-side events
| [`HX-Trigger-After-Settle`](@/headers/hx-trigger.md) | allows you to trigger client-side events after the settle step
| [`HX-Trigger-After-Swap`](@/headers/hx-trigger.md)   | allows you to trigger client-side events after the swap step

</div>

## Event Reference {#events}

**Note:** htmx 4 uses a new event naming convention with the pattern `htmx:phase:action` (e.g., `htmx:before:request`, `htmx:after:swap`).

<div class="info-table">

| Event | Description |
|-------|-------------|
| [`htmx:abort`](@/events.md#htmx:abort) | send this event to an element to abort a request
| [`htmx:before:init`](@/events.md#htmx:before:init) | triggered before htmx initializes a node
| [`htmx:after:init`](@/events.md#htmx:after:init) | triggered after htmx has initialized a node
| [`htmx:before:cleanup`](@/events.md#htmx:before:cleanup) | triggered before htmx cleans up an element
| [`htmx:after:cleanup`](@/events.md#htmx:after:cleanup) | triggered after htmx has cleaned up an element
| [`htmx:config:request`](@/events.md#htmx:config:request) | triggered before the request, allows you to customize parameters, headers
| [`htmx:before:request`](@/events.md#htmx:before:request) | triggered before an AJAX request is made
| [`htmx:after:request`](@/events.md#htmx:after:request) | triggered after an AJAX request has completed
| [`htmx:finally:request`](@/events.md#htmx:finally:request) | triggered in the finally block after a request
| [`htmx:before:swap`](@/events.md#htmx:before:swap) | triggered before a swap is done, allows you to configure the swap
| [`htmx:after:swap`](@/events.md#htmx:after:swap) | triggered after new content has been swapped in
| [`htmx:before:main:swap`](@/events.md#) | triggered before main content swap
| [`htmx:after:main:swap`](@/events.md#) | triggered after main content swap
| [`htmx:before:oob:swap`](@/events.md#htmx:before:oob:swap) | triggered before an out of band element swap
| [`htmx:after:oob:swap`](@/events.md#htmx:after:oob:swap) | triggered after an out of band element swap
| [`htmx:before:partial:swap`](@/events.md#) | triggered before a partial element swap
| [`htmx:after:partial:swap`](@/events.md#) | triggered after a partial element swap
| [`htmx:before:restore:history`](@/events.md#htmx:before:restore:history) | triggered before history restoration
| [`htmx:before:history:update`](@/events.md#htmx:before:history:update) | triggered before history is updated
| [`htmx:after:history:update`](@/events.md#htmx:after:history:update) | triggered after history has been updated
| [`htmx:after:push:into:history`](@/events.md#htmx:after:push:into:history) | triggered after a url is pushed into history
| [`htmx:after:replace:into:history`](@/events.md#htmx:after:replace:into:history) | triggered after a url is replaced in history
| [`htmx:error`](@/events.md#htmx:error) | triggered when an error occurs (network, response, swap, etc.)
| [`htmx:confirm`](@/events.md#htmx:confirm) | triggered after a trigger occurs on an element, allows you to cancel (or delay) issuing the AJAX request
| [`htmx:before:viewTransition`](@/events.md#htmx:before:viewTransition) | triggered before a view transition
| [`htmx:after:viewTransition`](@/events.md#htmx:after:viewTransition) | triggered after a view transition
| [`htmx:before:sse:stream`](@/events.md#htmx:before:sse:stream) | triggered before an SSE stream is processed
| [`htmx:after:sse:stream`](@/events.md#htmx:after:sse:stream) | triggered after an SSE stream ends
| [`htmx:before:sse:message`](@/events.md#htmx:before:sse:message) | triggered before an SSE message is processed
| [`htmx:after:sse:message`](@/events.md#htmx:after:sse:message) | triggered after an SSE message is processed
| [`htmx:before:sse:reconnect`](@/events.md#htmx:before:sse:reconnect) | triggered before reconnecting to an SSE stream

</div>

## JavaScript API Reference {#api}

<div class="info-table">

| Method | Description |
|-------|-------------|
| [`htmx.ajax()`](@/api.md#ajax)  | Issues an htmx-style ajax request
| [`htmx.config`](@/api.md#config)  | A property that holds the current htmx config object
| [`htmx.defineExtension()`](@/api.md#defineExtension)  | Defines an htmx [extension](https://htmx.org/extensions)
| [`htmx.find()`](@/api.md#find)  | Finds a single element matching the selector (supports extended selectors)
| [`htmx.findAll()`](@/api.md#findAll)  | Finds all elements matching a given selector (supports extended selectors)
| [`htmx.forEvent()`](@/api.md#)  | Returns a promise that resolves when the specified event fires
| [`htmx.on()`](@/api.md#on)  | Creates an event listener on the given element or document
| [`htmx.onLoad()`](@/api.md#onLoad)  | Adds a callback handler for the `htmx:after:init` event
| [`htmx.parseInterval()`](@/api.md#parseInterval)  | Parses an interval declaration into a millisecond value
| [`htmx.process()`](@/api.md#process)  | Processes the given element and its children, hooking up any htmx behavior
| [`htmx.swap()`](@/api.md#swap)  | Performs swapping of HTML content
| [`htmx.takeClass()`](@/api.md#takeClass)  | Takes a class from other elements for the given element
| [`htmx.timeout()`](@/api.md#)  | Returns a promise that resolves after the specified time
| [`htmx.trigger()`](@/api.md#trigger)  | Triggers an event on an element

</div>


## Configuration Reference {#config}

Htmx has some configuration options that can be accessed either programmatically or declaratively.  They are
listed below:

<div class="info-table">

| Config Variable                   | Info                                                                                                                                                                                                                                                                       |
|-----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.logAll`              | defaults to `false`, if set to `true` htmx will log all events to the console for debugging                                                                                                                                                                                |
| `htmx.config.prefix`              | defaults to `""` (empty string), allows you to use a custom prefix for htmx attributes (e.g., `"data-hx-"` to use `data-hx-get` instead of `hx-get`)                                                                                                                       |
| `htmx.config.transitions`         | defaults to `true`, whether to use view transitions when swapping content (if browser supports it)                                                                                                                                                                         |
| `htmx.config.history`             | defaults to `true`, whether to enable history support (push/replace URL)                                                                                                                                                                                                   |
| `htmx.config.historyReload`       | defaults to `false`, if set to `true` htmx will do a full page reload on history navigation instead of an AJAX request                                                                                                                                                     |
| `htmx.config.mode`                | defaults to `'same-origin'`, the fetch mode for AJAX requests. Can be `'cors'`, `'no-cors'`, or `'same-origin'`                                                                                                                                                            |
| `htmx.config.defaultSwap`         | defaults to `innerHTML`                                                                                                                                                                                                                                                    |
| `htmx.config.indicatorClass`      | defaults to `htmx-indicator`                                                                                                                                                                                                                                               |
| `htmx.config.requestClass`        | defaults to `htmx-request`                                                                                                                                                                                                                                                 |
| `htmx.config.includeIndicatorCSS` | defaults to `true` (determines if the indicator styles are loaded)                                                                                                                                                                                                         |
| `htmx.config.defaultTimeout`      | defaults to `60000` (60 seconds), the number of milliseconds a request can take before automatically being terminated                                                                                                                                                      |
| `htmx.config.inlineScriptNonce`   | defaults to `''`, meaning that no nonce will be added to inline scripts                                                                                                                                                                                                    |
| `htmx.config.inlineStyleNonce`    | defaults to `''`, meaning that no nonce will be added to inline styles                                                                                                                                                                                                     |
| `htmx.config.extensions`          | defaults to `''`, a comma-separated list of extension names to load (e.g., `'preload,optimistic'`)                                                                                                                                                                         |
| `htmx.config.streams`             | configuration for Server-Sent Events (SSE) streams. An object with the following properties: `mode` (`'once'` or `'continuous'`), `maxRetries` (default: `Infinity`), `initialDelay` (default: `500`ms), `maxDelay` (default: `30000`ms), `pauseHidden` (default: `false`) |
| `htmx.config.morphIgnore`         | defaults to `["data-htmx-powered"]`, array of attribute names to ignore when morphing elements                                                                                                                                                                             |
| `htmx.config.noSwap`              | defaults to `[204, 304]`, array of HTTP status codes that should not trigger a swap                                                                                                                                                                                        |
| `htmx.config.implicitInheritance` | defaults to `false`, if set to `true` attributes will be inherited from parent elements automatically without requiring the `:inherited` modifier                                                                                                                          |
| `htmx.config.metaCharacter`       | defaults to `undefined`, allows you to use a custom character instead of `:` for attribute modifiers (e.g., `-` to use `hx-get-inherited` instead of `hx-get:inherited`)                                                                                                   |


</div>

You can set them directly in javascript, or you can use a `meta` tag:

```html
<meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

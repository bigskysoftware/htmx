+++
title = "Reference"
+++

## Contents

* [htmx Core Attributes](#attributes)
* [htmx Additional Attributes](#attributes-additional)
* [htmx CSS Classes](#classes)
* [htmx Request Headers](#request_headers)
* [htmx Response Headers](#response_headers)
* [htmx Events](#events)
* [htmx Extensions](/extensions)
* [JavaScript API](#api)
* [Configuration Options](#config)

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

**Note:** htmx 4 uses a new event naming convention with the pattern `htmx:category:phase:action` (e.g., `htmx:before:request`, `htmx:after:swap`).

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
| [`htmx:before:main:swap`](@/events.md#htmx:before:main:swap) | triggered before main content swap
| [`htmx:after:main:swap`](@/events.md#htmx:after:main:swap) | triggered after main content swap
| [`htmx:before:oob:swap`](@/events.md#htmx:before:oob:swap) | triggered before an out of band element swap
| [`htmx:after:oob:swap`](@/events.md#htmx:after:oob:swap) | triggered after an out of band element swap
| [`htmx:before:partial:swap`](@/events.md#htmx:before:partial:swap) | triggered before a partial element swap
| [`htmx:after:partial:swap`](@/events.md#htmx:after:partial:swap) | triggered after a partial element swap
| [`htmx:before:restore:history`](@/events.md#htmx:before:restore:history) | triggered before history restoration
| [`htmx:before:history:update`](@/events.md#htmx:before:history:update) | triggered before history is updated
| [`htmx:after:history:update`](@/events.md#htmx:after:history:update) | triggered after history has been updated
| [`htmx:after:push:into:history`](@/events.md#htmx:after:push:into:history) | triggered after a url is pushed into history
| [`htmx:after:replace:into:history`](@/events.md#htmx:after:replace:into:history) | triggered after a url is replaced in history
| [`htmx:error`](@/events.md#htmx:error) | triggered when an error occurs (network, response, swap, etc.)
| [`htmx:confirm`](@/events.md#htmx:confirm) | triggered after a trigger occurs on an element, allows you to cancel (or delay) issuing the AJAX request
| [`htmx:validation:validate`](@/events.md#htmx:validation:validate) | triggered before an element is validated
| [`htmx:validation:failed`](@/events.md#htmx:validation:failed) | triggered when an element fails validation
| [`htmx:validation:halted`](@/events.md#htmx:validation:halted) | triggered when a request is halted due to validation errors
| [`htmx:trigger`](@/events.md#htmx:trigger) | triggered when a trigger condition is met

</div>

## JavaScript API Reference {#api}

<div class="info-table">

| Method | Description |
|-------|-------------|
| [`htmx.addClass()`](@/api.md#addClass)  | Adds a class to the given element
| [`htmx.ajax()`](@/api.md#ajax)  | Issues an htmx-style ajax request
| [`htmx.closest()`](@/api.md#closest)  | Finds the closest parent to the given element matching the selector
| [`htmx.config`](@/api.md#config)  | A property that holds the current htmx config object
| [`htmx.createEventSource`](@/api.md#createEventSource)  | A property holding the function to create SSE EventSource objects for htmx
| [`htmx.createWebSocket`](@/api.md#createWebSocket)  | A property holding the function to create WebSocket objects for htmx
| [`htmx.defineExtension()`](@/api.md#defineExtension)  | Defines an htmx [extension](https://htmx.org/extensions)
| [`htmx.find()`](@/api.md#find)  | Finds a single element matching the selector
| [`htmx.findAll()` `htmx.findAll(elt, selector)`](@/api.md#find)  | Finds all elements matching a given selector
| [`htmx.logAll()`](@/api.md#logAll)  | Installs a logger that will log all htmx events
| [`htmx.logger`](@/api.md#logger)  | A property set to the current logger (default is `null`)
| [`htmx.off()`](@/api.md#off)  | Removes an event listener from the given element
| [`htmx.on()`](@/api.md#on)  | Creates an event listener on the given element, returning it
| [`htmx.onLoad()`](@/api.md#onLoad)  | Adds a callback handler for the `htmx:load` event
| [`htmx.parseInterval()`](@/api.md#parseInterval)  | Parses an interval declaration into a millisecond value
| [`htmx.process()`](@/api.md#process)  | Processes the given element and its children, hooking up any htmx behavior
| [`htmx.remove()`](@/api.md#remove)  | Removes the given element
| [`htmx.removeClass()`](@/api.md#removeClass)  | Removes a class from the given element
| [`htmx.removeExtension()`](@/api.md#removeExtension)  | Removes an htmx [extension](https://htmx.org/extensions)
| [`htmx.swap()`](@/api.md#swap)  | Performs swapping (and settling) of HTML content
| [`htmx.takeClass()`](@/api.md#takeClass)  | Takes a class from other elements for the given element
| [`htmx.toggleClass()`](@/api.md#toggleClass)  | Toggles a class from the given element
| [`htmx.trigger()`](@/api.md#trigger)  | Triggers an event on an element
| [`htmx.values()`](@/api.md#values)  | Returns the input values associated with the given element

</div>


## Configuration Reference {#config}

Htmx has some configuration options that can be accessed either programmatically or declaratively.  They are
listed below:

<div class="info-table">

| Config Variable                        | Info                                                                                                                                                                       |
|----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.historyEnabled`           | defaults to `true`, really only useful for testing                                                                                                                         |
| `htmx.config.historyCacheSize`         | defaults to 10                                                                                                                                                             |
| `htmx.config.refreshOnHistoryMiss`     | defaults to `false`, if set to `true` htmx will issue a full page refresh on history misses rather than use an AJAX request                                                |
| `htmx.config.defaultSwapStyle`         | defaults to `outerHTML` in htmx 4                                                                                                                                          |
| `htmx.config.defaultSwapDelay`         | defaults to 0                                                                                                                                                              |
| `htmx.config.defaultSettleDelay`       | defaults to 20                                                                                                                                                             |
| `htmx.config.includeIndicatorStyles`   | defaults to `true` (determines if the indicator styles are loaded)                                                                                                         |
| `htmx.config.indicatorClass`           | defaults to `htmx-indicator`                                                                                                                                               |
| `htmx.config.requestClass`             | defaults to `htmx-request`                                                                                                                                                 |
| `htmx.config.addedClass`               | defaults to `htmx-added`                                                                                                                                                   |
| `htmx.config.settlingClass`            | defaults to `htmx-settling`                                                                                                                                                |
| `htmx.config.swappingClass`            | defaults to `htmx-swapping`                                                                                                                                                |
| `htmx.config.allowEval`                | defaults to `true`, can be used to disable htmx's use of eval for certain features (e.g. trigger filters)                                                                  |
| `htmx.config.allowScriptTags`          | defaults to `true`, determines if htmx will process script tags found in new content                                                                                       |
| `htmx.config.inlineScriptNonce`        | defaults to `''`, meaning that no nonce will be added to inline scripts                                                                                                    |
| `htmx.config.inlineStyleNonce`         | defaults to `''`, meaning that no nonce will be added to inline styles                                                                                                     |
| `htmx.config.attributesToSettle`       | defaults to `["class", "style", "width", "height"]`, the attributes to settle during the settling phase                                                                    |
| `htmx.config.disableSelector`          | defaults to `[hx-disable], [data-hx-disable]`, htmx will not process elements with this attribute on it or a parent                                                        |
| `htmx.config.disableInheritance`       | not applicable in htmx 4. Attribute inheritance is explicit using the `:inherited` modifier (e.g., `hx-confirm:inherited="Are you sure?"`)
| `htmx.config.withCredentials`          | defaults to `false`, allow cross-site Access-Control requests using credentials such as cookies, authorization headers or TLS client certificates                          |
| `htmx.config.timeout`                  | defaults to 0, the number of milliseconds a request can take before automatically being terminated                                                                         |
| `htmx.config.scrollBehavior`           | defaults to 'instant', the scroll behavior when using the [show](@/attributes/hx-swap.md#scrolling-scroll-show) modifier with `hx-swap`. The allowed values are `instant` (scrolling should happen instantly in a single jump), `smooth` (scrolling should animate smoothly) and `auto` (scroll behavior is determined by the computed value of [scroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior)). |
| `htmx.config.defaultFocusScroll`       | if the focused element should be scrolled into view, defaults to false and can be overridden using the [focus-scroll](@/attributes/hx-swap.md#focus-scroll) swap modifier. |
| `htmx.config.getCacheBusterParam`      | defaults to false, if set to true htmx will append the target element to the `GET` request in the format `org.htmx.cache-buster=targetElementId`                           |
| `htmx.config.viewTransitions`          | defaults to `true` in htmx 4, controls whether to use the [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) API when swapping      |
| `htmx.config.methodsThatUseUrlParams`  | defaults to `["get", "delete"]`, htmx will format requests with these methods by encoding their parameters in the URL, not the request body                                |
| `htmx.config.selfRequestsOnly`         | defaults to `true`, whether to only allow AJAX requests to the same domain as the current document                                                             |
| `htmx.config.ignoreTitle`              | defaults to `false`, if set to `true` htmx will not update the title of the document when a `title` tag is found in new content                                            |
| `htmx.config.scrollIntoViewOnBoost`    | defaults to `true`, whether or not the target of a boosted element is scrolled into the viewport. If `hx-target` is omitted on a boosted element, the target defaults to `body`, causing the page to scroll to the top. |
| `htmx.config.triggerSpecsCache`        | defaults to `null`, the cache to store evaluated trigger specifications into, improving parsing performance at the cost of more memory usage. You may define a simple object to use a never-clearing cache, or implement your own system using a [proxy object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy) |
| `htmx.config.responseHandling`         | the default [Response Handling](@/docs.md#response-handling) behavior for response status codes can be configured here to either swap or error                             |
| `htmx.config.allowNestedOobSwaps`      | defaults to `true`, whether to process OOB swaps on elements that are nested within the main response element. See [Nested OOB Swaps](@/attributes/hx-swap-oob.md#nested-oob-swaps). |
| `htmx.config.historyRestoreAsHxRequest`| defaults to `true`, Whether to treat history cache miss full page reload requests as a "HX-Request" by returning this response header. This should always be disabled when using HX-Request header to optionally return partial responses                                                                                                         |
| `htmx.config.reportValidityOfForms`    | defaults to `false`, Whether to report input validation errors to the end user and update focus to the first input that fails validation. This should always be enabled as this matches default browser form submit behaviour                                                                                                                     |


</div>

You can set them directly in javascript, or you can use a `meta` tag:

```html
<meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

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
* [htmx Extensions](https://extensions.htmx.org)
* [JavaScript API](#api)
* [Configuration Options](#config)

## Core Attribute Reference {#attributes}

The most common attributes when using htmx.

<div class="info-table">

| Attribute                                        | Description                                                                                                        |
|--------------------------------------------------|--------------------------------------------------------------------------------------------------------------------|
| [`hx-get`](@/attributes/hx-get.md)               | issues a `GET` to the specified URL                                                                                |
| [`hx-post`](@/attributes/hx-post.md)             | issues a `POST` to the specified URL                                                                               |
| [`hx-on*`](@/attributes/hx-on.md)                | handle events with inline scripts on elements                                                                      |
| [`hx-push-url`](@/attributes/hx-push-url.md)     | push a URL into the browser location bar to create history                                                         |
| [`hx-select`](@/attributes/hx-select.md)         | select content to swap in from a response                                                                          |
| [`hx-select-oob`](@/attributes/hx-select-oob.md) | select content to swap in from a response, somewhere other than the target (out of band)                           |
| [`hx-swap`](@/attributes/hx-swap.md)             | controls how content will swap in (`outerHTML`, `beforeend`, `afterend`, ...)                                      |
| [`hx-swap-oob`](@/attributes/hx-swap-oob.md)     | mark element to swap in from a response (out of band)                                                              |
| [`hx-target`](@/attributes/hx-target.md)         | specifies the target element to be swapped                                                                         |
| [`hx-trigger`](@/attributes/hx-trigger.md)       | specifies the event that triggers the request                                                                      |
| [`hx-vals`](@/attributes/hx-vals.md)             | add values to submit with the request (JSON format)                                                                |

</div>

## Additional Attribute Reference {#attributes-additional}

All other attributes available in htmx.

<div class="info-table">

| Attribute                                            | Description                                                                                                                        |
|------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| [`hx-boost`](@/attributes/hx-boost.md)               | add [progressive enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement) for links and forms                           |
| [`hx-confirm`](@/attributes/hx-confirm.md)           | shows a `confirm()` dialog before issuing a request                                                                                |
| [`hx-delete`](@/attributes/hx-delete.md)             | issues a `DELETE` to the specified URL                                                                                             |
| [`hx-disable`](@/attributes/hx-disable.md)           | disables htmx processing for the given node and any children nodes                                                                 |
| [`hx-disabled-elt`](@/attributes/hx-disabled-elt.md) | adds the `disabled` attribute to the specified elements while a request is in flight                                               |
| [`hx-disinherit`](@/attributes/hx-disinherit.md)     | control and disable automatic attribute inheritance for child nodes                                                                |
| [`hx-encoding`](@/attributes/hx-encoding.md)         | changes the request encoding type                                                                                                  |
| [`hx-ext`](@/attributes/hx-ext.md)                   | extensions to use for this element                                                                                                 |
| [`hx-headers`](@/attributes/hx-headers.md)           | adds to the headers that will be submitted with the request                                                                        |
| [`hx-history`](@/attributes/hx-history.md)           | prevent sensitive data being saved to the history cache                                                                            |
| [`hx-history-elt`](@/attributes/hx-history-elt.md)   | the element to snapshot and restore during history navigation                                                                      |
| [`hx-include`](@/attributes/hx-include.md)           | include additional data in requests                                                                                                |
| [`hx-indicator`](@/attributes/hx-indicator.md)       | the element to put the `htmx-request` class on during the request                                                                  |
| [`hx-inherit`](@/attributes/hx-inherit.md)           | control and enable automatic attribute inheritance for child nodes if it has been disabled by default                            |
| [`hx-params`](@/attributes/hx-params.md)             | filters the parameters that will be submitted with a request                                                                       |
| [`hx-patch`](@/attributes/hx-patch.md)               | issues a `PATCH` to the specified URL                                                                                              |
| [`hx-preserve`](@/attributes/hx-preserve.md)         | specifies elements to keep unchanged between requests                                                                              |
| [`hx-prompt`](@/attributes/hx-prompt.md)             | shows a `prompt()` before submitting a request                                                                                     |
| [`hx-put`](@/attributes/hx-put.md)                   | issues a `PUT` to the specified URL                                                                                                |
| [`hx-replace-url`](@/attributes/hx-replace-url.md)   | replace the URL in the browser location bar                                                                                        |
| [`hx-request`](@/attributes/hx-request.md)           | configures various aspects of the request                                                                                          |
| [`hx-sync`](@/attributes/hx-sync.md)                 | control how requests made by different elements are synchronized                                                                   |
| [`hx-validate`](@/attributes/hx-validate.md)         | force elements to validate themselves before a request                                                                             |
| [`hx-vars`](@/attributes/hx-vars.md)                 | adds values dynamically to the parameters to submit with the request (deprecated, please use [`hx-vals`](@/attributes/hx-vals.md)) |

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
| `HX-Current-URL` | the current URL of the browser
| `HX-History-Restore-Request` | "true" if the request is for history restoration after a miss in the local history cache
| `HX-Prompt` | the user response to an [hx-prompt](@/attributes/hx-prompt.md)
| `HX-Request` | always "true"
| `HX-Target` | the `id` of the target element if it exists
| `HX-Trigger-Name` | the `name` of the triggered element if it exists
| `HX-Trigger` | the `id` of the triggered element if it exists

</div>

### Response Headers Reference {#response_headers}

<div class="info-table">

| Header                                               | Description |
|------------------------------------------------------|-------------|
| [`HX-Location`](@/headers/hx-location.md)            | allows you to do a client-side redirect that does not do a full page reload
| [`HX-Push-Url`](@/headers/hx-push-url.md)            | pushes a new url into the history stack
| `HX-Redirect`                                        | can be used to do a client-side redirect to a new location
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

<div class="info-table">

| Event | Description |
|-------|-------------|
| [`htmx:abort`](@/events.md#htmx:abort) | send this event to an element to abort a request
| [`htmx:afterOnLoad`](@/events.md#htmx:afterOnLoad) | triggered after an AJAX request has completed processing a successful response
| [`htmx:afterProcessNode`](@/events.md#htmx:afterProcessNode) | triggered after htmx has initialized a node
| [`htmx:afterRequest`](@/events.md#htmx:afterRequest)  | triggered after an AJAX request has completed
| [`htmx:afterSettle`](@/events.md#htmx:afterSettle)  | triggered after the DOM has settled
| [`htmx:afterSwap`](@/events.md#htmx:afterSwap)  | triggered after new content has been swapped in
| [`htmx:beforeCleanupElement`](@/events.md#htmx:beforeCleanupElement)  | triggered before htmx [disables](@/attributes/hx-disable.md) an element or removes it from the DOM
| [`htmx:beforeOnLoad`](@/events.md#htmx:beforeOnLoad)  | triggered before any response processing occurs
| [`htmx:beforeProcessNode`](@/events.md#htmx:beforeProcessNode) | triggered before htmx initializes a node
| [`htmx:beforeRequest`](@/events.md#htmx:beforeRequest)  | triggered before an AJAX request is made
| [`htmx:beforeSwap`](@/events.md#htmx:beforeSwap)  | triggered before a swap is done, allows you to configure the swap
| [`htmx:beforeSend`](@/events.md#htmx:beforeSend)  | triggered just before an ajax request is sent
| [`htmx:configRequest`](@/events.md#htmx:configRequest)  | triggered before the request, allows you to customize parameters, headers
| [`htmx:confirm`](@/events.md#htmx:confirm)  | triggered after a trigger occurs on an element, allows you to cancel (or delay) issuing the AJAX request
| [`htmx:historyCacheError`](@/events.md#htmx:historyCacheError)  | triggered on an error during cache writing
| [`htmx:historyCacheMiss`](@/events.md#htmx:historyCacheMiss)  | triggered on a cache miss in the history subsystem
| [`htmx:historyCacheMissError`](@/events.md#htmx:historyCacheMissError)  | triggered on a unsuccessful remote retrieval
| [`htmx:historyCacheMissLoad`](@/events.md#htmx:historyCacheMissLoad)  | triggered on a successful remote retrieval
| [`htmx:historyRestore`](@/events.md#htmx:historyRestore)  | triggered when htmx handles a history restoration action
| [`htmx:beforeHistorySave`](@/events.md#htmx:beforeHistorySave)  | triggered before content is saved to the history cache
| [`htmx:load`](@/events.md#htmx:load)  | triggered when new content is added to the DOM
| [`htmx:noSSESourceError`](@/events.md#htmx:noSSESourceError)  | triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined
| [`htmx:onLoadError`](@/events.md#htmx:onLoadError)  | triggered when an exception occurs during the onLoad handling in htmx
| [`htmx:oobAfterSwap`](@/events.md#htmx:oobAfterSwap)  | triggered after an out of band element as been swapped in
| [`htmx:oobBeforeSwap`](@/events.md#htmx:oobBeforeSwap)  | triggered before an out of band element swap is done, allows you to configure the swap
| [`htmx:oobErrorNoTarget`](@/events.md#htmx:oobErrorNoTarget)  | triggered when an out of band element does not have a matching ID in the current DOM
| [`htmx:prompt`](@/events.md#htmx:prompt)  | triggered after a prompt is shown
| [`htmx:pushedIntoHistory`](@/events.md#htmx:pushedIntoHistory)  | triggered after an url is pushed into history
| [`htmx:responseError`](@/events.md#htmx:responseError)  | triggered when an HTTP response error (non-`200` or `300` response code) occurs
| [`htmx:sendError`](@/events.md#htmx:sendError)  | triggered when a network error prevents an HTTP request from happening
| [`htmx:sseError`](@/events.md#htmx:sseError)  | triggered when an error occurs with a SSE source
| [`htmx:sseOpen`](/events#htmx:sseOpen)  | triggered when a SSE source is opened
| [`htmx:swapError`](@/events.md#htmx:swapError)  | triggered when an error occurs during the swap phase
| [`htmx:targetError`](@/events.md#htmx:targetError)  | triggered when an invalid target is specified
| [`htmx:timeout`](@/events.md#htmx:timeout)  | triggered when a request timeout occurs
| [`htmx:validation:validate`](@/events.md#htmx:validation:validate)  | triggered before an element is validated
| [`htmx:validation:failed`](@/events.md#htmx:validation:failed)  | triggered when an element fails validation
| [`htmx:validation:halted`](@/events.md#htmx:validation:halted)  | triggered when a request is halted due to validation errors
| [`htmx:xhr:abort`](@/events.md#htmx:xhr:abort)  | triggered when an ajax request aborts
| [`htmx:xhr:loadend`](@/events.md#htmx:xhr:loadend)  | triggered when an ajax request ends
| [`htmx:xhr:loadstart`](@/events.md#htmx:xhr:loadstart)  | triggered when an ajax request starts
| [`htmx:xhr:progress`](@/events.md#htmx:xhr:progress)  | triggered periodically during an ajax request that supports progress events

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
| [`htmx.defineExtension()`](@/api.md#defineExtension)  | Defines an htmx [extension](https://extensions.htmx.org)
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
| [`htmx.removeExtension()`](@/api.md#removeExtension)  | Removes an htmx [extension](https://extensions.htmx.org)
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

| Config Variable                       | Info                                                                                                                                                                       |
|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.historyEnabled`          | defaults to `true`, really only useful for testing                                                                                                                         |
| `htmx.config.historyCacheSize`        | defaults to 10                                                                                                                                                             |
| `htmx.config.refreshOnHistoryMiss`    | defaults to `false`, if set to `true` htmx will issue a full page refresh on history misses rather than use an AJAX request                                                |
| `htmx.config.defaultSwapStyle`        | defaults to `innerHTML`                                                                                                                                                    |
| `htmx.config.defaultSwapDelay`        | defaults to 0                                                                                                                                                              |
| `htmx.config.defaultSettleDelay`      | defaults to 20                                                                                                                                                             |
| `htmx.config.includeIndicatorStyles`  | defaults to `true` (determines if the indicator styles are loaded)                                                                                                         |
| `htmx.config.indicatorClass`          | defaults to `htmx-indicator`                                                                                                                                               |
| `htmx.config.requestClass`            | defaults to `htmx-request`                                                                                                                                                 |
| `htmx.config.addedClass`              | defaults to `htmx-added`                                                                                                                                                   |
| `htmx.config.settlingClass`           | defaults to `htmx-settling`                                                                                                                                                |
| `htmx.config.swappingClass`           | defaults to `htmx-swapping`                                                                                                                                                |
| `htmx.config.allowEval`               | defaults to `true`, can be used to disable htmx's use of eval for certain features (e.g. trigger filters)                                                                  |
| `htmx.config.allowScriptTags`         | defaults to `true`, determines if htmx will process script tags found in new content                                                                                       |
| `htmx.config.inlineScriptNonce`       | defaults to `''`, meaning that no nonce will be added to inline scripts                                                                                                    |
| `htmx.config.inlineSlyeNonce`         | defaults to `''`, meaning that no nonce will be added to inline styles                                                                                                     |
| `htmx.config.attributesToSettle`      | defaults to `["class", "style", "width", "height"]`, the attributes to settle during the settling phase                                                                    |
| `htmx.config.wsReconnectDelay`        | defaults to `full-jitter`                                                                                                                                                  |
| `htmx.config.wsBinaryType`            | defaults to `blob`, the [the type of binary data](https://developer.mozilla.org/docs/Web/API/WebSocket/binaryType) being received over the WebSocket connection            |
| `htmx.config.disableSelector`         | defaults to `[hx-disable], [data-hx-disable]`, htmx will not process elements with this attribute on it or a parent                                                        |
| `htmx.config.withCredentials`         | defaults to `false`, allow cross-site Access-Control requests using credentials such as cookies, authorization headers or TLS client certificates                          |
| `htmx.config.timeout`                 | defaults to 0, the number of milliseconds a request can take before automatically being terminated                                                                         |
| `htmx.config.scrollBehavior`          | defaults to 'instant', the behavior for a boosted link on page transitions. The allowed values are `auto`, `instant` and `smooth`. Instant will scroll instantly in a single jump, smooth will scroll smoothly, while auto will behave like a vanilla link. |
| `htmx.config.defaultFocusScroll`      | if the focused element should be scrolled into view, defaults to false and can be overridden using the [focus-scroll](@/attributes/hx-swap.md#focus-scroll) swap modifier. |
| `htmx.config.getCacheBusterParam`     | defaults to false, if set to true htmx will append the target element to the `GET` request in the format `org.htmx.cache-buster=targetElementId`                           |
| `htmx.config.globalViewTransitions`   | if set to `true`, htmx will use the [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) API when swapping in new content.             |
| `htmx.config.methodsThatUseUrlParams` | defaults to `["get"]`, htmx will format requests with these methods by encoding their parameters in the URL, not the request body                                          |
| `htmx.config.selfRequestsOnly`        | defaults to `true`, whether to only allow AJAX requests to the same domain as the current document                                                             |
| `htmx.config.ignoreTitle`             | defaults to `false`, if set to `true` htmx will not update the title of the document when a `title` tag is found in new content                                            |
| `htmx.config.scrollIntoViewOnBoost`   | defaults to `true`, whether or not the target of a boosted element is scrolled into the viewport. If `hx-target` is omitted on a boosted element, the target defaults to `body`, causing the page to scroll to the top. |
| `htmx.config.triggerSpecsCache`       | defaults to `null`, the cache to store evaluated trigger specifications into, improving parsing performance at the cost of more memory usage. You may define a simple object to use a never-clearing cache, or implement your own system using a [proxy object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy) |
| `htmx.config.allowNestedOobSwaps`     | defaults to `true`, whether to process OOB swaps on elements that are nested within the main response element. See [Nested OOB Swaps](@/attributes/hx-swap-oob.md#nested-oob-swaps). |

</div>

You can set them directly in javascript, or you can use a `meta` tag:

```html
<meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

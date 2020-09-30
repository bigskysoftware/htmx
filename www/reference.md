---
layout: layout.njk
title: </> htmx - Attributes
---


## Contents

* [Htmx Attribute Reference](#attributes)
* [Htmx CSS Class Reference](#classes)
* [Htmx Request Headers Reference](#request_headers)
* [Htmx Response Headers Reference](#response_headers)
* [Htmx Event Reference](#events)
* [Htmx Extensions Reference](/extensions#reference)

## <a name="attributes"></a> [Attribute Reference](#attributes)

<div class="info-table">

| Attribute | Description |
|-----------|-------------|
| [`hx-boost`](/attributes/hx-boost) | progressively enhances anchors and forms to use AJAX requests
| [`hx-confirm`](/attributes/hx-confirm) | shows a confim() dialog before issuing a request
| [`hx-delete`](/attributes/hx-delete) | issues a `DELETE` to the specified URL
| [`hx-ext`](/attributes/hx-ext) | extensions to use for this element
| [`hx-get`](/attributes/hx-get) | issues a `GET` to the specified URL
| [`hx-history-elt`](/attributes/hx-history-elt) | the element to snapshot and restore during history navigation
| [`hx-include`](/attributes/hx-include) | includes additional data in AJAX requests
| [`hx-indicator`](/attributes/hx-indicator) | the element to put the `htmx-request` class on during the AJAX request
| [`hx-params`](/attributes/hx-params) | filters the parameters that will be submitted with a request
| [`hx-patch`](/attributes/hx-patch) | issues a `PATCH` to the specified URL
| [`hx-post`](/attributes/hx-post) | issues a `POST` to the specified URL
| [`hx-prompt`](/attributes/hx-prompt) | shows a prompt before submitting a request
| [`hx-push-url`](/attributes/hx-push-url) | pushes the URL into the location bar, creating a new history entry
| [`hx-put`](/attributes/hx-put) | issues a `PUT` to the specified URL
| [`hx-select`](/attributes/hx-select) | selects a subset of the server response to process
| [`hx-sse`](/attributes/hx-sse) | establishes and listens to [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) sources for events
| [`hx-swap-oob`](/attributes/hx-swap-oob) | marks content in a response as being "Out of Band", i.e. swapped somewhere other than the target 
| [`hx-swap`](/attributes/hx-swap) | controls how the response content is swapped into the DOM (e.g. 'outerHTML' or 'beforeEnd')
| [`hx-target`](/attributes/hx-target) | specifies the target element to be swapped
| [`hx-trigger`](/attributes/hx-trigger) | specifies the event that triggers the request
| [`hx-vars`](/attributes/hx-vars) | adds to the parameters that will be submitted with the request
| [`hx-ws`](/attributes/hx-ws) | establishes a `WebSocket` or sends information to one

</div>

## <a name="classes"></a> [CSS Class Reference](#classes)

<div class="info-table">

| Class | Description |
|-----------|-------------|
| `htmx-indicator` | A dynamically generated class that will toggle visible (opacity:1) when a `htmx-request` class is present
| `htmx-request` | Applied to either the element or the element specified with [`hx-indicator`](/attributes/hx-indicator) while a request is ongoing
| `htmx-settling` | Applied to a target after content is swapped, removed after it is settled
| `htmx-swapping` | Applied to a target before any content is swapped, removed after it is swapped

</div>

## <a name="headers"></a> [HTTP Header Reference](#headers)

### <a name="request_headers"></a> [Request Headers Reference](#request_headers)

<div class="info-table">

| Header | Description |
|-------|-------------|
| `X-HTTP-Method-Override` | the HTTP verb for non-`GET` and `POST` requests
| `HX-Active-Element-Name` | the `name` of the active element if it exists
| `HX-Active-Element-Value` | the `value` of the active element if it exists
| `HX-Active-Element` | the `id` of the active element if it exists
| `HX-Current-URL` | the current URL of the browser
| `HX-Event-Target` | the `id` of the original event target 
| `HX-Prompt` | the user response to an [ic-prompt](/attributes/hx-prompt)
| `HX-Request` | always `true`
| `HX-Target` | the `id` of the target element if it exists
| `HX-Trigger-Name` | the `name` of the triggered element if it exists
| `HX-Trigger` | the `id` of the triggered element if it exists

</div>

### <a name="response_headers"></a> [Response Headers Reference](#response_headers)

<div class="info-table">

| Header | Description |
|-------|-------------|
| `HX-Push` | pushes a new url into the history stack
| [`HX-Trigger`](/headers/x-hx-trigger) | allows you to trigger client side events, see the [documentation](/headers/x-hx-trigger) for more info

</div>

## <a name="events"></a> [Event Reference](#events)

<div class="info-table">

| Event | Description |
|-------|-------------|
| [`htmx:afterOnLoad`](/events#htmx:afterOnLoad) | triggered after an AJAX request has completed processing a successful response
| [`htmx:afterRequest`](/events#htmx:afterRequest)  | triggered after an AJAX request has completed
| [`htmx:afterSettle`](/events#htmx:afterSettle)  | triggered after the DOM has settled
| [`htmx:afterSwap`](/events#htmx:afterSwap)  | triggered after new content has been swapped in
| [`htmx:beforeOnLoad`](/events#htmx:beforeOnLoad)  | triggered before any response processing occurs
| [`htmx:beforeRequest`](/events#htmx:beforeRequest)  | triggered before an AJAX request is made
| [`htmx:beforeSwap`](/events#htmx:beforeSwap)  | triggered before a swap is done
| [`htmx:configRequest`](/events#htmx:configRequest)  | triggered before the request, allows you to customize parameters, headers
| [`htmx:historyCacheMiss`](/events#htmx:historyCacheMiss)  | triggered on a cache miss in the history subsystem
| [`htmx:historyCacheMissError`](/events#htmx:historyCacheMissError)  | triggered on a unsuccessful remote retrieval 
| [`htmx:historyCacheMissLoad`](/events#htmx:historyCacheMissLoad)  | triggered on a succesful remote retrieval 
| [`htmx:historyRestore`](/events#htmx:historyRestore)  | triggered when htmx handles a history restoration action
| [`htmx:beforeHistorySave`](/events#htmx:beforeHistorySave)  | triggered before content is saved to the history cache
| [`htmx:load`](/events#htmx:load)  | triggered when new content is added to the DOM
| [`htmx:noSSESourceError`](/events#htmx:noSSESourceError)  | triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined
| [`htmx:onLoadError`](/events#htmx:onLoadError)  | triggered when an exception occurs during the onLoad handling in htmx
| [`htmx:oobErrorNoTarget`](/events#htmx:oobErrorNoTarget)  | triggered when an out of band element does not have a matching ID in the current DOM
| [`htmx:prompt`](/events#htmx:prompt)  | triggered after a prompt is shown
| [`htmx:responseError`](/events#htmx:responseError)  | triggered when an HTTP response error (non-`200` or `300` response code) occurs
| [`htmx:sendError`](/events#htmx:sendError)  | triggered when a network error prevents an HTTP request from happening
| [`htmx:sseError`](/events#htmx:sseError)  | triggered when an error occurs with a SSE source
| [`htmx:swapError`](/events#htmx:swapError)  | triggered when an error occurs during the swap phase
| [`htmx:targetError`](/events#htmx:targetError)  | triggered when an invalid target is specified
| [`htmx:validation:validate`](/events#htmx:validation:validate)  | triggered before an element is validated
| [`htmx:validation:failed`](/events#htmx:validation:failed)  | triggered when an element fails validation
| [`htmx:validation:halted`](/events#htmx:validation:halted)  | triggered when a request is halted due to validation errors
| [`htmx:xhr:abort`](/events#htmx:xhr:abort)  | triggered when an ajax request aborts
| [`htmx:xhr:loadend`](/events#htmx:xhr:loadend)  | triggered when an ajax request ends
| [`htmx:xhr:loadstart`](/events#htmx:xhr:loadstart)  | triggered when an ajax request starts
| [`htmx:xhr:progress`](/events#htmx:xhr:progress)  | triggered periodically during an ajax request that supports progress events

</div>


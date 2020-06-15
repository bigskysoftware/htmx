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
| [`hx-error-url`](/attributes/hx-error-url) | a URL to send client-side errors to
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
| `X-HX-Active-Element-Name` | the `name` of the active element if it exists
| `X-HX-Active-Element-Value` | the `value` of the active element if it exists
| `X-HX-Active-Element` | the `id` of the active element if it exists
| `X-HX-Current-URL` | the current URL of the browser
| `X-HX-Event-Target` | the `id` of the original event target 
| `X-HX-Prompt` | the user response to an [hx-prompt](/attributes/hx-prompt)
| `X-HX-Request` | always `true`
| `X-HX-Target` | the `id` of the target element if it exists
| `X-HX-Trigger-Name` | the `name` of the triggered element if it exists
| `X-HX-Trigger` | the `id` of the triggered element if it exists

</div>

### <a name="response_headers"></a> [Response Headers Reference](#response_headers)

<div class="info-table">

| Header | Description |
|-------|-------------|
| `X-HX-Push` | pushes a new url into the history stack
| [`X-HX-Trigger`](/headers/x-hx-trigger) | allows you to trigger client side events, see the [documentation](/headers/x-hx-trigger) for more info

</div>

## <a name="events"></a> [Event Reference](#events)

<div class="info-table">

| Event | Description |
|-------|-------------|
| [`afterOnLoad.htmx`](/events#afterOnLoad.htmx) | triggered after an AJAX request has completed processing a successful response
| [`afterRequest.htmx`](/events#afterRequest.htmx)  | triggered after an AJAX request has completed
| [`afterSettle.htmx`](/events#afterSettle.htmx)  | triggered after the DOM has settled
| [`afterSwap.htmx`](/events#afterSwap.htmx)  | triggered after new content has been swapped in
| [`beforeOnLoad.htmx`](/events#beforeOnLoad.htmx)  | triggered before any response processing occurs
| [`beforeRequest.htmx`](/events#beforeRequest.htmx)  | triggered before an AJAX request is made
| [`beforeSwap.htmx`](/events#beforeSwap.htmx)  | triggered before a swap is done
| [`configRequest.htmx`](/events#configRequest.htmx)  | triggered before the request, allows you to customize parameters, headers
| [`historyCacheMiss.htmx`](/events#historyCacheMiss.htmx)  | triggered on a cache miss in the history subsystem
| [`historyCacheMissError.htmx`](/events#historyCacheMissError.htmx)  | triggered on a unsuccessful remote retrieval 
| [`historyCacheMissLoad.htmx`](/events#historyCacheMissLoad.htmx)  | triggered on a succesful remote retrieval 
| [`historyRestore.htmx`](/events#historyRestore.htmx)  | triggered when htmx handles a history restoration action
| [`beforeHistorySave.htmx`](/events#beforeHistorySave.htmx)  | triggered before content is saved to the history cache
| [`load.htmx`](/events#load.htmx)  | triggered when new content is added to the DOM
| [`noSSESourceError.htmx`](/events#noSSESourceError.htmx)  | triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined
| [`onLoadError.htmx`](/events#onLoadError.htmx)  | triggered when an exception occurs during the onLoad handling in htmx
| [`oobErrorNoTarget.htmx`](/events#oobErrorNoTarget.htmx)  | triggered when an out of band element does not have a matching ID in the current DOM
| [`prompt.htmx`](/events#prompt.htmx)  | triggered after a prompt is shown
| [`responseError.htmx`](/events#responseError.htmx)  | triggered when an HTTP response error (non-`200` or `300` response code) occurs
| [`sendError.htmx`](/events#sendError.htmx)  | triggered when a network error prevents an HTTP request from happening
| [`sseError.htmx`](/events#sseError.htmx)  | triggered when an error occurs with a SSE source
| [`swapError.htmx`](/events#swapError.htmx)  | triggered when an error occurs during the swap phase
| [`targetError.htmx`](/events#targetError.htmx)  | triggered when an invalid target is specified

</div>


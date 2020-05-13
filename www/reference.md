---
layout: layout.njk
title: </> kutty - Attributes
---

## Attribute Reference

| Attribute | Description |
|-----------|-------------|
| [`kt-boost`](/attributes/kt-boost) | progressively enhances anchors and forms to use AJAX requests
| [`kt-classes`](/attributes/kt-classes) | timed modification of classes on an element
| [`kt-confirm`](/attributes/kt-confirm) | shows a confim() dialog before issuing a request
| [`kt-delete`](/attributes/kt-delete) | issues a `DELETE` to the specified URL
| [`kt-error-url`](/attributes/kt-error-url) | a URL to send client-side errors to
| [`kt-get`](/attributes/kt-get) | issues a `GET` to the specified URL
| [`kt-history-elt`](/attributes/kt-history-elt) | the element to snapshot and restore during history navigation
| [`kt-include`](/attributes/kt-include) | includes additional data in AJAX requests
| [`kt-indicator`](/attributes/kt-indicator) | the element to put the `kutty-request` class on during the AJAX request
| [`kt-params`](/attributes/kt-params) | filters the parameters that will be submitted with a request
| [`kt-patch`](/attributes/kt-patch) | issues a `PATCH` to the specified URL
| [`kt-post`](/attributes/kt-post) | issues a `POST` to the specified URL
| [`kt-prompt`](/attributes/kt-prompt) | shows a prompt before submitting a request
| [`kt-push-url`](/attributes/kt-push-url) | pushes the URL into the location bar, creating a new history entry
| [`kt-put`](/attributes/kt-put) | issues a `PUT` to the specified URL
| [`kt-select`](/attributes/kt-select) | selects a subset of the server response to process
| [`kt-sse-src`](/attributes/kt-sse-src) | establishes an [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) source for events
| [`kt-swap-oob`](/attributes/kt-swap-oob) | marks content in a response as being "Out of Band", i.e. swapped somewhere other than the target 
| [`kt-swap`](/attributes/kt-swap) | controls how the response content is swapped into the DOM (e.g. 'outerHTML' or 'beforeEnd')
| [`kt-target`](/attributes/kt-target) | specifies the target element to be swapped
| [`kt-trigger`](/attributes/kt-trigger) | specifies the event that triggers the request

## CSS Class Reference

| Class | Description |
|-----------|-------------|
| `kutty-indicator` | A dynamically generated class that will toggle visible (opacity:1) when a `kutty-request` class is present
| `kutty-request` | Applied to either the element or the element specified with [`kt-indicator`](/attributes/kt-indicator) while a request is ongoing
| `kutty-settling` | Applied to a target after content is swapped, removed after it is settled
| `kutty-swapping` | Applied to a target before any content is swapped, removed after it is swapped


## HTTP Header Reference

### Request Headers 
| Header | Description |
|-------|-------------|
| `X-HTTP-Method-Override` | the HTTP verb for non-`GET` and `POST` requests
| `X-KT-Active-Element-Name` | the `name` of the active element if it exists
| `X-KT-Active-Element-Value` | the `value` of the active element if it exists
| `X-KT-Active-Element` | the `id` of the active element if it exists
| `X-KT-Current-URL` | the current URL of the browser
| `X-KT-Event-Target` | the `id` of the original event target 
| `X-KT-Prompt` | the user response to an [ic-prompt](/attributes/kt-prompt)
| `X-KT-Request` | always `true`
| `X-KT-Target` | the `id` of the target element if it exists
| `X-KT-Trigger-Name` | the `name` of the triggered element if it exists
| `X-KT-Trigger` | the `id` of the triggered element if it exists

### Response Headers
| Header | Description |
|-------|-------------|
| `X-KT-Push` | pushes a new url into the history stack
| [`X-KT-Trigger`](/headers/x-kt-trigger) | allows you to trigger client side events, see the [documentation](/headers/x-kt-trigger) for more info

## Event Reference

| Event | Description |
|-------|-------------|
| [`afterOnLoad.kutty`](/events#afterOnLoad.kutty) | triggered after an AJAX request has finished
| [`afterSettle.kutty`](/events#afterSettle.kutty)  | triggered after the DOM has settled
| [`afterSwap.kutty`](/events#afterSwap.kutty)  | triggered after new content has been swapped in
| [`beforeOnLoad.kutty`](/events#beforeOnLoad.kutty)  | triggered before any response processing occurs
| [`beforeRequest.kutty`](/events#beforeRequest.kutty)  | triggered before an AJAX request is made
| [`beforeSwap.kutty`](/events#beforeSwap.kutty)  | triggered before a swap is done
| [`configRequest.kutty`](/events#configRequest.kutty)  | triggered before the request, allows you to customize parameters, headers
| [`historyCacheMiss.kutty`](/events#historyCacheMiss.kutty)  | triggered on a cache miss in the history subsystem
| [`historyCacheMissError.kutty`](/events#historyCacheMissError.kutty)  | triggered on a unsuccessful remote retrieval 
| [`historyCacheMissLoad.kutty`](/events#historyCacheMissLoad.kutty)  | triggered on a succesful remote retrieval 
| [`historyRestore.kutty`](/events#historyRestore.kutty)  | triggered when kutty handles a history restoration action
| [`beforeHistorySave.kutty`](/events#beforeHistorySave.kutty)  | triggered before content is saved to the history cache
| [`initSSE.kutty`](/events#initSSE.kutty) | triggered when a new Server Sent Event source is created
| [`load.kutty`](/events#load.kutty)  | triggered when new content is added to the DOM
| [`noSSESourceError.kutty`](/events#noSSESourceError.kutty)  | triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined
| [`onLoadError.kutty`](/events#onLoadError.kutty)  | triggered when an exception occurs during the onLoad handling in kutty
| [`oobErrorNoTarget.kutty`](/events#oobErrorNoTarget.kutty)  | triggered when an out of band element does not have a matching ID in the current DOM
| [`prompt.kutty`](/events#prompt.kutty)  | triggered after a prompt is shown
| [`responseError.kutty`](/events#responseError.kutty)  | triggered when an HTTP response error (non-`200` or `300` response code) occurs
| [`sendError.kutty`](/events#sendError.kutty)  | triggered when a network error prevents an HTTP request from happening
| [`sseError.kutty`](/events#sseError.kutty)  | triggered when an error occurs with a SSE source
| [`swapError.kutty`](/events#swapError.kutty)  | triggered when an error occurs during the swap phase
| [`targetError.kutty`](/events#targetError.kutty)  | triggered when an invalid target is specified

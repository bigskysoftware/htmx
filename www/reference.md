---
layout: layout.njk
title: </> kutty - Attributes
---

## Attribute Reference

| Attribute | Description |
|-----------|-------------|
| [`kt-boost`](/attributes/kt-boost) | converts anchors and forms to use AJAX requests
| [`kt-classes`](/attributes/kt-classes) | timed modification of classes on an element
| [`kt-confirm`](/attributes/kt-confirm) | shows a confim() dialog before issuing a request
| [`kt-delete`](/attributes/kt-delete) | issues a `DELETE` to the specified URL
| [`kt-error-url`](/attributes/kt-error-url) | a URL to send client-side errors to
| [`kt-get`](/attributes/kt-get) | issues a `GET` to the specified URL
| [`kt-history-elt`](/attributes/kt-history-elt) | the element to snapshot and restore during history navigation
| [`kt-include`](/attributes/kt-include) | includes additional data in AJAX requests
| [`kt-indicator`](/attributes/kt-indicator) | the element to put the `kutty-request` class on during the AJAX request
| [`kt-patch`](/attributes/kt-patch) | issues a `PATCH` to the specified URL
| [`kt-params`](/attributes/kt-params) | filters the parameters that will be submitted with a request
| [`kt-post`](/attributes/kt-post) | issues a `POST` to the specified URL
| [`kt-prompt`](/attributes/kt-prompt) | shows a prompt before submitting a request
| [`kt-push-url`](/attributes/kt-push-url) | pushes the URL into the location bar, creating a new history entry
| [`kt-put`](/attributes/kt-put) | issues a `PUT` to the specified URL
| [`kt-select`](/attributes/kt-select) | selects a subset of the server response to process
| [`kt-sse-src`](/attributes/kt-sse-src) | establishes an [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) source for events
| [`kt-swap`](/attributes/kt-swap) | controls how the response content is swapped into the DOM (e.g. 'outerHTML' or 'beforeEnd')
| [`kt-swap-oob`](/attributes/kt-swap-oob) | marks content in a response as being "Out of Band", i.e. swapped somewhere other than the target 
| [`kt-target`](/attributes/kt-target) | specifies the target element to be swapped
| [`kt-trigger`](/attributes/kt-trigger) | specifies the event that triggers the request

## CSS Class Reference

| Class | Description |
|-----------|-------------|
| `kutty-request` | Applied to either the element or the element specified with [`kt-indicator`](/attributes/kt-indicator) while a request is ongoing
| `kutty-indicator` | A dynamically generated class that will toggle visible (opacity:1) when a `kutty-request` class is present
| `kutty-swapping` | Applied to a target before any content is swapped, removed after it is swapped
| `kutty-settling` | Applied to a target after content is swapped, removed after it is settled


## HTTP Header Reference

### Request Headers 
| Header | Description |
|-------|-------------|
| `X-HTTP-Method-Override` | the HTTP verb for non-`GET` and `POST` requests
| `X-KT-Request` | always `true`
| `X-KT-Trigger` | the `id` of the triggered element if it exists
| `X-KT-Trigger-Name` | the `name` of the triggered element if it exists
| `X-KT-Target` | the `id` of the target element if it exists
| `X-KT-Current-URL` | the current URL of the browser
| `X-KT-Prompt` | the user response to an [ic-prompt](/attributes/kt-prompt)
| `X-KT-Event-Target` | the `id` of the original event target 
| `X-KT-Active-Element` | the `id` of the active element if it exists
| `X-KT-Active-Element-Name` | the `name` of the active element if it exists
| `X-KT-Active-Element-Value` | the `value` of the active element if it exists

### Response Headers
| Header | Description |
|-------|-------------|
| X-KT-Trigger | allows you to trigger client side events, see the [documentation](/headers/x-kt-trigger) for more info
| X-KT-Push | pushes a new url into the history stack

## Event Reference

| Event | Description |
|-------|-------------|
| afterOnLoad.kutty | TODO - Description
| afterSettle.kutty | TODO - Description
| afterSettle.kutty | TODO - Description
| afterSwap.kutty | TODO - Description
| beforeOnLoad.kutty | TODO - Description
| beforeRequest.kutty | TODO - Description
| beforeSwap.kutty | TODO - Description
| historyCacheMiss.kutty | TODO - Description
| historyCacheMissLoad.kutty | TODO - Description
| historyRestore.kutty | TODO - Description
| historyUpdate.kutty | TODO - Description
| initSSE.kutty | TODO - Description
| load.kutty | TODO - Description
| noSSESourceError.kutty | TODO - Description
| onLoadError.kutty | TODO - Description
| oobErrorNoTarget.kutty | TODO - Description
| prompt.kutty | TODO - Description
| responseError.kutty | TODO - Description
| sendError.kutty | TODO - Description
| sseError.kutty | TODO - Description
| swapError.kutty | TODO - Description
| values.kutty | TODO - Description

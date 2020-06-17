---
layout: layout.njk
title: </> htmx - high power tools for html
---

## Events

Htmx provides an extensive events system that can be used to modify and enhance behavior.  Events
are listed below.

### <a name="afterOnLoad.htmx"></a> Event - [`afterOnLoad.htmx`](#afterOnLoad.htmx)

This event is triggered after an AJAX `onload` has finished.  Note that this does not mean that the content
has been swapped or settled yet, only that the request has finished.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="afterRequest.htmx"></a> Event - [`afterRequest.htmx`](#afterRequest.htmx)

This event is triggered after an AJAX request has finished either in the case of a successful request (although
one that may have returned a remote error code such as a `404`) or in a network error situation.  This event
can be paried with [`beforeRequest.htmx`](#beforeRequest.htmx) to wrap behavior around a request cycle.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="afterSettle.htmx"></a> Event - [`afterSettle.htmx`](#afterSettle.htmx)

This event is triggered after the DOM has [settled](/docs#settling).

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="afterSwap.htmx"></a> Event - [`afterSwap.htmx`](#afterSwap.htmx)

This event is triggered after new content has been  [swapped into the DOM](/docs#swapping).

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="beforeOnLoad.htmx"></a> Event - [`beforeOnLoad.htmx`](#beforeOnLoad.htmx)

This event is triggered before any response processing occurs.  If the event is cancelled, no swap will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="beforeRequest.htmx"></a> Event - [`beforeRequest.htmx`](#beforeRequest.htmx)

This event is triggered before an AJAX request is issued.  If the event is cancelled, no request will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="beforeSwap.htmx"></a> Event - [`beforeSwap.htmx`](#beforeSwap.htmx)

This event is triggered before any new content has been [swapped into the DOM](/docs#swapping).  If the event is cancelled, no swap will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="configRequest.htmx"></a> Event - [`configRequest.htmx`](#configRequest.htmx)

This event is triggered after htmx has collected parameters for inclusion in the request.  It can be
used to include or update the parameters that htmx will send:

```javascript
document.body.addEventListener('configRequest.htmx', function(evt) {
    evt.detail.parameters['auth_token'] = getAuthToken(); // add a new parameter into the mix
});
```

Note that if an input value appears more than once the value in the `parameters` object will be an array, rather
than a single value.

##### Details

* `detail.parameters` - the parameters that will be submitted in the request
* `detail.unfilteredParameters` - the parameters that were found before filtering by [`hx-select`](/attributes/hx-select)
* `detail.headers` - the request headers
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.verb` - the HTTP verb in use

### <a name="historyCacheMiss.htmx"></a> Event - [`historyCacheMiss.htmx`](#historyCacheMiss.htmx)

This event is triggered when a cache miss occurs when restoring history

##### Details

* `detail.xhr` - the `XMLHttpRequest` that will retrieve the remote content for restoration
* `detail.path` - the path and query of the page being restored

### <a name="historyCacheMissError.htmx"></a> Event - [`historyCacheMissError.htmx`](#historyCacheMissError.htmx)

This event is triggered when a cache miss occurs and a response has been retrieved from the server
for the content to restore, but the response is an error (e.g. `404`)

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.path` - the path and query of the page being restored

### <a name="historyCacheMissLoad.htmx"></a> Event - [`historyCacheMissLoad.htmx`](#historyCacheMissLoad.htmx)

This event is triggered when a cache miss occurs and a response has been retrieved succesfully from the server
for the content to restore 

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.path` - the path and query of the page being restored

### <a name="historyRestore.htmx"></a> Event - [`historyRestore.htmx`](#historyRestore.htmx)

This event is triggered when htmx handles a history restoration action

##### Details

* `detail.path` - the path and query of the page being restored

### <a name="beforeHistorySave.htmx"></a> Event - [`beforeHistorySave.htmx`](#beforeHistorySave.htmx)

This event is triggered when htmx handles a history restoration action

##### Details

* `detail.path` - the path and query of the page being restored
* `detail.historyElt` - the history element being restored into

##### Details

* `detail.config` - the config that will be passed to the `EventSource` contstructor

### <a name="load.htmx"></a> Event - [`load.htmx`](#load.htmx)

This event is triggered when a new node is loaded into the DOM by htmx.

##### Details

* `detail.elt` - the newly added element

### <a name="noSSESourceError.htmx"></a> Event - [`noSSESourceError.htmx`](#noSSESourceError.htmx)

This event is triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined

##### Details

* `detail.elt` - the element with the bad SSE trigger

### <a name="onLoadError.htmx"></a> Event - [`onLoadError.htmx`](#onLoadError.htmx)

This event is triggered when an error occurs during the `load` handling of an AJAX call

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.exception` - the exception that occurred

### <a name="oobErrorNoTarget.htmx"></a> Event - [`oobErrorNoTarget.htmx`](#oobErrorNoTarget.htmx)

This event is triggered when an [out of band swap](/docs##oob_swaps) does not have a corresponding element
in the DOM to switch with.

##### Details

* `detail.content` - the element with the bad oob `id`

### <a name="prompt.htmx"></a> Event - [`prompt.htmx`](#prompt.htmx)

This event is triggered after a prompt has been shown to the user with the [`hx-prompt`](/attributes/hx-prompt)
attribute.  If this event is cancelled, the AJAX request will not occur.

##### Details

* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.prompt` - the user response to the prompt

### <a name="responseError.htmx"></a> Event - [`responseError.htmx`](#responseError.htmx)

This event is triggered when an HTTP error response occurs

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request

### <a name="sendError.htmx"></a> Event - [`sendError.htmx`](#sendError.htmx)

This event is triggered when a network error prevents an HTTP request from occurring

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request

### <a name="sseError.htmx"></a> Event - [`sseError.htmx`](#sseError.htmx)

This event is triggered when an error occurs with a SSE source

##### Details

* `detail.elt` - the element with the bad SSE source
* `detail.error` - the error
* `detail.source` - the SSE source

### <a name="swapError.htmx"></a> Event - [`swapError.htmx`](#swapError.htmx)

This event is triggered when an error occurs during the swap phase

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request

### <a name="targetError.htmx"></a> Event - [`targetError.htmx`](#targetError.htmx)

This event is triggered when a bad selector is used for a [`hx-target`](/attributes/hx-target) attribute (e.g. an
element id without a preceding `#`)

##### Details

* `detail.elt` - the element that triggered the request
* `detail.target` - the bad CSS selector


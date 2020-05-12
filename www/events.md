---
layout: layout.njk
title: </> kutty - high power tools for html
---

## Events

Kutty provides an extensive events system that can be used to modify and enhance behavior.  Events
are listed below.

### <a name="afterOnLoad.kutty"></a> Event: [`afterOnLoad.kutty`](#afterOnLoad.kutty)

This event is triggered after an AJAX `onload` has finished.  Note that this does not mean that the content
has been swapped or settled yet, only that the request has finished.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="afterSettle.kutty"></a> Event: [`afterSettle.kutty`](#afterSettle.kutty)

This event is triggered after the DOM has [settled](/docs#settling).

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="afterSwap.kutty"></a> Event: [`afterSwap.kutty`](#afterSwap.kutty)

This event is triggered after new content has been  [swapped into the DOM](/docs#swapping).

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="beforeOnLoad.kutty"></a> Event: [`beforeOnLoad.kutty`](#beforeOnLoad.kutty)

This event is triggered before any new content has been [swapped into the DOM](/docs#swapping).  If
the event is cancelled, no swap will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="beforeRequest.kutty"></a> Event: [`beforeRequest.kutty`](#beforeRequest.kutty)

This event is triggered before an AJAX request is issued.  If the event is cancelled, no request will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request

### <a name="historyCacheMiss.kutty"></a> Event: [`historyCacheMiss.kutty`](#historyCacheMiss.kutty)

This event is triggered when a cache miss occurs when restoring history

##### Details

* `detail.xhr` - the `XMLHttpRequest` that will retrieve the remote content for restoration
* `detail.path` - the path and query of the page being restored

### <a name="historyCacheMissLoad.kutty"></a> Event: [`historyCacheMissLoad.kutty`](#historyCacheMissLoad.kutty)

This event is triggered when a cache miss occurs and a response has been retrieved succesfully from the server
for the content to restore 

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.path` - the path and query of the page being restored

### <a name="historyCacheMissError.kutty"></a> Event: [`historyCacheMissError.kutty`](#historyCacheMissError.kutty)

This event is triggered when a cache miss occurs and a response has been retrieved from the server
for the content to restore, but the response is an error (e.g. `404`)

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.path` - the path and query of the page being restored

### <a name="historyRestore.kutty"></a> Event: [`historyRestore.kutty`](#historyRestore.kutty)

This event is triggered when kutty handles a history restoration action

##### Details

* `detail.path` - the path and query of the page being restored

### <a name="historyUpdate.kutty"></a> Event: [`historyUpdate.kutty`](#historyUpdate.kutty)

This event is triggered when kutty handles a history restoration action

##### Details

* `detail.path` - the path and query of the page being restored
* `detail.historyElt` - the history element being restored into

### <a name="initSSE.kutty"></a> Event: [`initSSE.kutty`](#initSSE.kutty)

This event is triggered when kutty initializes a new SSE source.  It can be used
to [configure the source](https://developer.mozilla.org/en-US/docs/Web/API/EventSource/EventSource).

Note that by default `withCredentials` will be set to `true` in the configuration.

##### Details

* `detail.config` - the config that will be passed to the `EventSource` contstructor

### <a name="load.kutty"></a> Event: [`load.kutty`](#load.kutty)

This event is triggered when a new node is loaded into the DOM by kutty.

##### Details

* `detail.elt` - the newly added element

### <a name="noSSESourceError.kutty"></a> Event: [`noSSESourceError.kutty`](#noSSESourceError.kutty)

This event is triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined

##### Details

* `detail.elt` - the element with the bad SSE trigger

### <a name="onLoadError.kutty"></a> Event: [`onLoadError.kutty`](#onLoadError.kutty)

This event is triggered when an error occurs during the `load` handling of an AJAX call

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.exception` - the exception that occurred

### <a name="oobErrorNoTarget.kutty"></a> Event: [`oobErrorNoTarget.kutty`](#oobErrorNoTarget.kutty)

This event is triggered when an [out of band swap](/docs##oob_swaps) does not have a corresponding element
in the DOM to switch with.

##### Details

* `detail.content` - the element with the bad oob `id`

### <a name="prompt.kutty"></a> Event: [`prompt.kutty`](#prompt.kutty)

This event is triggered after a prompt has been shown to the user with the [`kt-prompt`](/attributes/kt-prompt)
attribute.  If this event is cancelled, the AJAX request will not occur.

##### Details

* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.prompt` - the user response to the prompt

### <a name="responseError.kutty"></a> Event: [`responseError.kutty`](#responseError.kutty)

This event is triggered when an HTTP error response occurs

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request

### <a name="sendError.kutty"></a> Event: [`sendError.kutty`](#sendError.kutty)

This event is triggered when a network error prevents an HTTP request from occurring

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request

### <a name="sseError.kutty"></a> Event: [`sseError.kutty`](#sseError.kutty)

This event is triggered when an error occurs with a SSE source

##### Details

* `detail.elt` - the element with the bad SSE source
* `detail.error` - the error
* `detail.source` - the SSE source

### <a name="swapError.kutty"></a> Event: [`swapError.kutty`](#swapError.kutty)

This event is triggered when an error occurs during the swap phase

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request

### <a name="parameters.kutty"></a> Event: [`parameters.kutty`](#parameters.kutty)

This event is triggered after kutty has collected parameters for inclusion in the request.  It can be
used to include or update the parameters that kutty will send:

```javascript
document.body.addEventListener('parameters.kutty', function(evt) {
    evt.detail.parameters['auth_token'] = getAuthToken(); // add a new parameter into the mix
});
```

Note that if an input value appears more than once the value in the `parameters` object will be an array, rather
than a single value.

##### Details

* `detail.parameters` - the parameters that will be submitted in the request
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request




---
layout: layout.njk
title: </> htmx - Events
---

## Events

Htmx provides an extensive events system that can be used to modify and enhance behavior.  Events
are listed below.

### <a name="htmx:afterOnLoad"></a> Event - [`htmx:afterOnLoad`](#htmx:afterOnLoad)

This event is triggered after an AJAX `onload` has finished.  Note that this does not mean that the content
has been swapped or settled yet, only that the request has finished.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:afterProcessNode"></a> Event - [`htmx:afterProcessNode`](#htmx:afterProcessNode)

This event is triggered after htmx has initialized a DOM node.  It can be useful for extensions to build additional features onto a node.

##### Details

* `detail.elt` - the element that dispatched the request

### <a name="htmx:afterRequest"></a> Event - [`htmx:afterRequest`](#htmx:afterRequest)

This event is triggered after an AJAX request has finished either in the case of a successful request (although
one that may have returned a remote error code such as a `404`) or in a network error situation.  This event
can be paired with [`htmx:beforeRequest`](#htmx:beforeRequest) to wrap behavior around a request cycle.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:afterSettle"></a> Event - [`htmx:afterSettle`](#htmx:afterSettle)

This event is triggered after the DOM has [settled](/docs#settling).

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:afterSwap"></a> Event - [`htmx:afterSwap`](#htmx:afterSwap)

This event is triggered after new content has been  [swapped into the DOM](/docs#swapping).

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:beforeOnLoad"></a> Event - [`htmx:beforeOnLoad`](#htmx:beforeOnLoad)

This event is triggered before any response processing occurs.  If the event is cancelled, no swap will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:beforeProcessNode"></a> Event - [`htmx:beforeProcessNode`](#htmx:beforeProcessNode)

This event is triggered before htmx initializes a DOM node and has processed all of its `hx-` attributes.  This gives extensions and other external code the ability to modify the contents of a DOM node before it is processed.

##### Details

* `detail.elt` - the element that dispatched the request

### <a name="htmx:beforeRequest"></a> Event - [`htmx:beforeRequest`](#htmx:beforeRequest)

This event is triggered before an AJAX request is issued.  If the event is cancelled, no request will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:beforeSend"></a> Event - [`htmx:beforeSend`](#htmx:beforeSend)

This event is triggered right before a request is sent.  You may not cancel the request with this event.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:beforeSwap"></a> Event - [`htmx:beforeSwap`](#htmx:beforeSwap)

This event is triggered before any new content has been [swapped into the DOM](/docs#swapping).  If the event is cancelled, no swap will occur.

You can modify the default swap behavior by modifying the `shouldSwap` and `target` properties of the event detail. See
the documentation on [configuring swapping](#modifying_swapping_behavior_with_events) for more details.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request
* `detail.shouldSwap` - if the content will be swapped (defaults to `false` for non-200 response codes)
* `detail.target` - the target of the swap

### <a name="htmx:configRequest"></a> Event - [`htmx:configRequest`](#htmx:configRequest)

This event is triggered after htmx has collected parameters for inclusion in the request.  It can be
used to include or update the parameters that htmx will send:

```javascript
document.body.addEventListener('htmx:configRequest', function(evt) {
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

### <a name="htmx:historyCacheError"></a> Event - [`htmx:historyCacheError`](#htmx:historyCacheError)

This event is triggered when an attempt to save the cache to `localStorage` fails

##### Details

* `detail.cause` - the `Exception` that was thrown when attempting to save history to `localStorage`

### <a name="htmx:historyCacheMiss"></a> Event - [`htmx:historyCacheMiss`](#htmx:historyCacheMiss)

This event is triggered when a cache miss occurs when restoring history

##### Details

* `detail.xhr` - the `XMLHttpRequest` that will retrieve the remote content for restoration
* `detail.path` - the path and query of the page being restored

### <a name="htmx:historyCacheMissError"></a> Event - [`htmx:historyCacheMissError`](#htmx:historyCacheMissError)

This event is triggered when a cache miss occurs and a response has been retrieved from the server
for the content to restore, but the response is an error (e.g. `404`)

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.path` - the path and query of the page being restored

### <a name="htmx:historyCacheMissLoad"></a> Event - [`htmx:historyCacheMissLoad`](#htmx:historyCacheMissLoad)

This event is triggered when a cache miss occurs and a response has been retrieved succesfully from the server
for the content to restore

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.path` - the path and query of the page being restored

### <a name="htmx:historyRestore"></a> Event - [`htmx:historyRestore`](#htmx:historyRestore)

This event is triggered when htmx handles a history restoration action

##### Details

* `detail.path` - the path and query of the page being restored

### <a name="htmx:beforeHistorySave"></a> Event - [`htmx:beforeHistorySave`](#htmx:beforeHistorySave)

This event is triggered when htmx handles a history restoration action

##### Details

* `detail.path` - the path and query of the page being restored
* `detail.historyElt` - the history element being restored into

##### Details

* `detail.config` - the config that will be passed to the `EventSource` contstructor

### <a name="htmx:load"></a> Event - [`htmx:load`](#htmx:load)

This event is triggered when a new node is loaded into the DOM by htmx.

##### Details

* `detail.elt` - the newly added element

### <a name="htmx:noSSESourceError"></a> Event - [`htmx:noSSESourceError`](#htmx:noSSESourceError)

This event is triggered when an element refers to a SSE event in its trigger, but no parent SSE source has been defined

##### Details

* `detail.elt` - the element with the bad SSE trigger

### <a name="htmx:onLoadError"></a> Event - [`htmx:onLoadError`](#htmx:onLoadError)

This event is triggered when an error occurs during the `load` handling of an AJAX call

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.exception` - the exception that occurred
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:oobErrorNoTarget"></a> Event - [`htmx:oobErrorNoTarget`](#htmx:oobErrorNoTarget)

This event is triggered when an [out of band swap](/docs##oob_swaps) does not have a corresponding element
in the DOM to switch with.

##### Details

* `detail.content` - the element with the bad oob `id`

### <a name="htmx:prompt"></a> Event - [`htmx:prompt`](#htmx:prompt)

This event is triggered after a prompt has been shown to the user with the [`hx-prompt`](/attributes/hx-prompt)
attribute.  If this event is cancelled, the AJAX request will not occur.

##### Details

* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.prompt` - the user response to the prompt

### <a name="htmx:pushedIntoHistory"></a> Event - [`htmx:pushedIntoHistory`](#htmx:pushedIntoHistory)

This event is triggered after an url has been pushed into history.

##### Details

* `detail.path` - the path and query of the url that has been pushed into history

### <a name="htmx:responseError"></a> Event - [`htmx:responseError`](#htmx:responseError)

This event is triggered when an HTTP error response occurs

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:sendError"></a> Event - [`htmx:sendError`](#htmx:sendError)

This event is triggered when a network error prevents an HTTP request from occurring

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:sseError"></a> Event - [`htmx:sseError`](#htmx:sseError)

This event is triggered when an error occurs with a SSE source

##### Details

* `detail.elt` - the element with the bad SSE source
* `detail.error` - the error
* `detail.source` - the SSE source

### <a name="htmx:swapError"></a> Event - [`htmx:swapError`](#htmx:swapError)

This event is triggered when an error occurs during the swap phase

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### <a name="htmx:targetError"></a> Event - [`htmx:targetError`](#htmx:targetError)

This event is triggered when a bad selector is used for a [`hx-target`](/attributes/hx-target) attribute (e.g. an
element id without a preceding `#`)

##### Details

* `detail.elt` - the element that triggered the request
* `detail.target` - the bad CSS selector

### <a name="htmx:validation:validate"></a> Event - [htmx:validation:validate](#htmx:validation:validate)

This event is triggered before an element is validated.  It can be used with the `elt.setCustomValidity()` method
to implement custom validation rules.

```html
<form hx-post="/test">
  <input _="on htmx:validation:validate
               if my.value != 'foo'
                  call me.setCustomValidity('Please enter the value foo')
               else
                  call me.setCustomValidity('')"
         name="example">
</form>
```

##### Details

* `detail.elt` - the element that triggered the request

### <a name="htmx:validation:failed"></a> Event - [htmx:validation:failed](#htmx:validation:failed)

This event is triggered when an element fails validation.

##### Details

* `detail.elt` - the element that triggered the request
* `detail.message` - the validation error message
* `detail.validity` - the validity object, which contains properties specifying how validation failed

### <a name="htmx:validation:halted"></a> Event - [htmx:validation:halted](#htmx:validation:halted)

This event is triggered when a request is halted due to validation errors.

##### Details

* `detail.elt` - the element that triggered the request
* `detail.errors` - an array of error objects with the invalid elements and errors associated with them

### <a name="htmx:xhr:abort"></a> Event - [htmx:xhr:abort](#htmx:xhr:abort)

This event is triggered when an ajax request aborts

##### Details

* `detail.elt` - the element that triggered the request

### <a name="htmx:xhr:loadstart"></a> Event - [htmx:xhr:loadstart](#htmx:xhr:loadstart)

This event is triggered when an ajax request starts

##### Details

* `detail.elt` - the element that triggered the request

### <a name="htmx:xhr:loadend"></a> Event - [htmx:xhr:loadend](#htmx:xhr:loadend)

This event is triggered when an ajax request finishes

##### Details

* `detail.elt` - the element that triggered the request

### <a name="htmx:xhr:progress"></a> Event - [htmx:xhr:progress](#htmx:xhr:progress)

This event is triggered periodically when an ajax request that supports progress is in flight

##### Details

* `detail.elt` - the element that triggered the request

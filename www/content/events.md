+++
title = "Events"
+++

Htmx provides an extensive events system that can be used to modify and enhance behavior.  Events
are listed below.

### Event - `htmx:abort` {#htmx:abort}

This event is different than other events: htmx does not *trigger* it, but rather *listens* for it.

If you send an `htmx:abort` event to an element making a request, it will abort the request:

```html
<button id="request-button" hx-post="/example">Issue Request</button>
<button onclick="htmx.trigger('#request-button', 'htmx:abort')">Cancel Request</button>
```

### Event - `htmx:afterOnLoad` {#htmx:afterOnLoad}

This event is triggered after an AJAX `onload` has finished.  Note that this does not mean that the content
has been swapped or settled yet, only that the request has finished.

##### Details

* `detail.elt` - the element that dispatched the request or if the body no longer contains the element then the closest parent
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:afterProcessNode` {#htmx:afterProcessNode}

This event is triggered after htmx has initialized a DOM node.  It can be useful for extensions to build additional features onto a node.

##### Details

* `detail.elt` - the element being initialized

### Event - `htmx:afterRequest` {#htmx:afterRequest}

This event is triggered after an AJAX request has finished either in the case of a successful request (although
one that may have returned a remote error code such as a `404`) or in a network error situation.  This event
can be paired with [`htmx:beforeRequest`](#htmx:beforeRequest) to wrap behavior around a request cycle.

##### Details

* `detail.elt` - the element that dispatched the request or if the body no longer contains the element then the closest parent
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request
* `detail.successful` - true if the response has a 20x status code or is marked `detail.isError = false` in the
  `htmx:beforeSwap` event, else false
* `detail.failed` - true if the response does not have a 20x status code or is marked `detail.isError = true` in the
  `htmx:beforeSwap` event, else false

### Event - `htmx:afterSettle` {#htmx:afterSettle}

This event is triggered after the DOM has [settled](@/docs.md#request-operations).

##### Details

* `detail.elt` - the updated element
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:afterSwap` {#htmx:afterSwap}

This event is triggered after new content has been [swapped into the DOM](@/docs.md#swapping).

##### Details

* `detail.elt` - the swapped in element
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:beforeCleanupElement` {#htmx:beforeCleanupElement}

This event is triggered before htmx [disables](@/attributes/hx-disable.md) an element or removes it from the DOM.

##### Details

* `detail.elt` - the element to be cleaned up

### Event - `htmx:beforeOnLoad` {#htmx:beforeOnLoad}

This event is triggered before any response processing occurs.  If you call `preventDefault()` on the event to cancel it, no swap will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:beforeProcessNode` {#htmx:beforeProcessNode}

This event is triggered before htmx initializes a DOM node and has processed all of its `hx-` attributes.  This gives extensions and other external code the ability to modify the contents of a DOM node before it is processed.

##### Details

* `detail.elt` - the element being initialized

### Event - `htmx:beforeRequest` {#htmx:beforeRequest}

This event is triggered before an AJAX request is issued.  If you call `preventDefault()` on the event to cancel it, no request will occur.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.boosted` - true if the request is via an element using boosting
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:beforeSend` {#htmx:beforeSend}

This event is triggered right before a request is sent.  You may not cancel the request with this event.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:beforeSwap` {#htmx:beforeSwap}

This event is triggered before any new content has been [swapped into the DOM](@/docs.md#swapping).
Most values on `detail` can be set to override subsequent behavior, other than where response headers take precedence.
If you call `preventDefault()` on the event to cancel it, no swap will occur.

You can modify the default swap behavior by modifying the `shouldSwap`, `selectOverride`, `swapOverride` and `target` properties of the event detail.
See the documentation on [configuring swapping](@/docs.md#modifying_swapping_behavior_with_events) for more details.

##### Details

* `detail.elt` - the target of the swap
* `detail.xhr` - the `XMLHttpRequest`
* `detail.boosted` - true if the request is via an element using boosting
* `detail.requestConfig` - the configuration of the AJAX request
* `detail.requestConfig.elt` - the element that dispatched the request
* `detail.shouldSwap` - if the content will be swapped (defaults to `false` for non-200 response codes)
* `detail.ignoreTitle` - if `true` any title tag in the response will be ignored
* `detail.isError` - whether error events should be triggered and also determines the values of `detail.successful` and `detail.failed` in later events
* `detail.serverResponse` - the server response as text to be used for the swap
* `detail.selectOverride` - add this to use instead of an [`hx-select`](@/attributes/hx-select.md) value
* `detail.swapOverride` - add this to use instead of an [`hx-swap`](@/attributes/hx-swap.md) value
* `detail.target` - the target of the swap

### Event - `htmx:beforeTransition` {#htmx:beforeTransition}

This event is triggered before a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) 
wrapped swap occurs.  If you call `preventDefault()` on the event to cancel it, the View Transition will not occur and the normal swapping logic will
happen instead.

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.boosted` - true if the request is via an element using boosting
* `detail.requestConfig` - the configuration of the AJAX request
* `detail.shouldSwap` - if the content will be swapped (defaults to `false` for non-200 response codes)
* `detail.target` - the target of the swap

### Event - `htmx:configRequest` {#htmx:configRequest}

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
* `detail.unfilteredParameters` - the parameters that were found before filtering by [`hx-params`](@/attributes/hx-params.md)
* `detail.headers` - the request headers
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.verb` - the HTTP verb in use

### Event - `htmx:confirm` {#htmx:confirm}

This event is fired on every trigger for a request (not just on elements that have a hx-confirm attribute).
It allows you to cancel (or delay) issuing the AJAX request.
If you call `preventDefault()` on the event, it will not issue the given request.
The `detail` object contains a function, `evt.detail.issueRequest(skipConfirmation=false)`, that can be used to issue the actual AJAX request at a later point.
Combining these two features allows you to create an asynchronous confirmation dialog.

Here is a basic example that shows the basic usage of the `htmx:confirm` event without altering the default behavior:

```javascript
document.body.addEventListener('htmx:confirm', function(evt) {
  // 0. To modify the behavior only for elements with the hx-confirm attribute,
  //    check if evt.detail.target.hasAttribute('hx-confirm')

  // 1. Prevent the default behavior (this will prevent the request from being issued)
  evt.preventDefault();
  
  // 2. Do your own logic here
  console.log(evt.detail)

  // 3. Manually issue the request when you are ready
  evt.detail.issueRequest(); // or evt.detail.issueRequest(true) to skip the built-in window.confirm()
});
```

And here is an example using [sweet alert](https://sweetalert.js.org/guides/) on any element with a `confirm-with-sweet-alert="{question}"` attribute on it:

```javascript
document.body.addEventListener('htmx:confirm', function(evt) {
  // 1. The requirement to show the sweet alert is that the element has a confirm-with-sweet-alert
  //    attribute on it, if it doesn't we can return early and let the default behavior happen
  if (!evt.detail.target.hasAttribute('confirm-with-sweet-alert')) return

  // 2. Get the question from the attribute
  const question = evt.detail.target.getAttribute('confirm-with-sweet-alert');

  // 3. Prevent the default behavior (this will prevent the request from being issued)
  evt.preventDefault();

  // 4. Show the sweet alert
  swal({
    title: "Are you sure?",
    text: question || "Are you sure you want to continue?",
    icon: "warning",
    buttons: true,
    dangerMode: true,
  }).then((confirmed) => {
    if (confirmed) {
      // 5. If the user confirms, we can manually issue the request
      evt.detail.issueRequest(true); // true to skip the built-in window.confirm()
    }
  });
});
```

##### Details

* `detail.elt` - the element in question
* `detail.etc` - additional request information (mostly unused)
* `detail.issueRequest(skipConfirmation=false)` - a function that can be invoked to issue the request (should be paired with `evt.preventDefault()`!), if skipConfirmation is `true` the original `window.confirm()` is not executed
* `detail.path` - the path of the request
* `detail.target` - the element that triggered the request
* `detail.triggeringEvent` - the original event that triggered this request
* `detail.verb` - the verb of the request (e.g. `GET`)
* `detail.question` - the question passed to `hx-confirm` attribute (only available if `hx-confirm` attribute is present)

### Event - `htmx:historyCacheError` {#htmx:historyCacheError}

This event is triggered when an attempt to save the cache to `localStorage` fails

##### Details

* `detail.cause` - the `Exception` that was thrown when attempting to save history to `localStorage`

### Event - `htmx:historyCacheHit` {#htmx:historyCacheHit}

This event is triggered when a cache hit occurs when restoring history

You can prevent the history restoration via `preventDefault()` to allow alternative restore handling.
You can also override the details of the history restoration request in this event if required

##### Details

* `detail.historyElt` - the history element or body that will get replaced
* `detail.item.content` - the content of the cache that will be swapped in
* `detail.item.title` - the page title to update from the cache
* `detail.path` - the path and query of the page being restored
* `detial.swapSpec` - the swapSpec to be used containing the defatul swapStyle='innerHTML'

### Event - `htmx:historyCacheMiss` {#htmx:historyCacheMiss}

This event is triggered when a cache miss occurs when restoring history

You can prevent the history restoration via `preventDefault()` to allow alternative restore handling.
You can also modify the xhr request or other details before it makes the the request to restore history

##### Details

* `detail.historyElt` - the history element or body that will get replaced
* `detail.xhr` - the `XMLHttpRequest` that will retrieve the remote content for restoration
* `detail.path` - the path and query of the page being restored
* `detial.swapSpec` - the swapSpec to be used containing the defatul swapStyle='innerHTML'

### Event - `htmx:historyCacheMissLoadError` {#htmx:historyCacheMissLoadError}

This event is triggered when a cache miss occurs and a response has been retrieved from the server
for the content to restore, but the response is an error (e.g. `404`)

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.path` - the path and query of the page being restored

### Event - `htmx:historyCacheMissLoad` {#htmx:historyCacheMissLoad}

This event is triggered when a cache miss occurs and a response has been retrieved successfully from the server
for the content to restore

You can modify the details before it makes the swap to restore the history

##### Details

* `detail.historyElt` - the history element or body that will get replaced
* `detail.xhr` - the `XMLHttpRequest`
* `detail.path` - the path and query of the page being restored
* `detail.response` - the response text that will be swapped in
* `detial.swapSpec` - the swapSpec to be used containing the defatul swapStyle='innerHTML'

### Event - `htmx:historyRestore` {#htmx:historyRestore}

This event is triggered when htmx handles a history restoration action

##### Details

* `detail.path` - the path and query of the page being restored
* `detail.cacheMiss` - set `true` if restore was a cache miss
* `detail.serverResponse` - with cache miss has the response text replaced
* `detail.item` - with cache hit the cache details that was restored

### Event - `htmx:beforeHistorySave` {#htmx:beforeHistorySave}

This event is triggered before the content is saved in the history cache.

You can modify the contents of the historyElt to remove 3rd party javascript changes so a clean copy of the content can be backed up to the history cache

##### Details

* `detail.path` - the path and query of the page being saved
* `detail.historyElt` - the history element about to be saved

### Event - `htmx:load` {#htmx:load}

This event is triggered when a new node is loaded into the DOM by htmx. Note that this event is also triggered when htmx is first initialized, with the document body as the target.

##### Details

* `detail.elt` - the newly added element

### Event - `htmx:noSSESourceError` {#htmx:noSSESourceError}

This event is triggered when an element refers to an SSE event in its trigger, but no parent SSE source has been defined

##### Details

* `detail.elt` - the element with the bad SSE trigger

### Event - `htmx:oobAfterSwap` {#htmx:oobAfterSwap}

This event is triggered as part of an [out of band swap](@/docs.md#oob_swaps) and behaves identically to an [after swap event](#htmx:afterSwap)

##### Details

* `detail.elt` - the swapped in element
* `detail.shouldSwap` - if the content will be swapped (defaults to `true`)
* `detail.target` - the target of the swap
* `detail.fragment` - the response fragment

### Event - `htmx:oobBeforeSwap` {#htmx:oobBeforeSwap}

This event is triggered as part of an [out of band swap](@/docs.md#oob_swaps) and behaves identically to a [before swap event](#htmx:beforeSwap)

##### Details

* `detail.elt` - the target of the swap
* `detail.shouldSwap` - if the content will be swapped (defaults to `true`)
* `detail.target` - the target of the swap
* `detail.fragment` - the response fragment

### Event - `htmx:oobErrorNoTarget` {#htmx:oobErrorNoTarget}

This event is triggered when an [out of band swap](@/docs.md#oob_swaps) does not have a corresponding element
in the DOM to switch with.

##### Details

* `detail.content` - the element with the bad oob `id`

### Event - `htmx:onLoadError` {#htmx:onLoadError}

This event is triggered when an error occurs during the `load` handling of an AJAX call

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.exception` - the exception that occurred
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:prompt` {#htmx:prompt}

This event is triggered after a prompt has been shown to the user with the [`hx-prompt`](@/attributes/hx-prompt.md)
attribute.  If this event is cancelled, the AJAX request will not occur.

##### Details

* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.prompt` - the user response to the prompt

### Event - `htmx:beforeHistoryUpdate` {#htmx:beforeHistoryUpdate}

This event is triggered before a history update is performed. It can be
used to modify the `path` or `type` used to update the history.

##### Details

* `detail.history` - the `path` and `type` (push, replace) for the history update
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:pushedIntoHistory` {#htmx:pushedIntoHistory}

This event is triggered after a URL has been pushed into history.

##### Details

* `detail.path` - the path and query of the URL that has been pushed into history

### Event - `htmx:replacedInHistory` {#htmx:replacedInHistory}

This event is triggered after a URL has been replaced in history.

##### Details

* `detail.path` - the path and query of the URL that has been replaced in history

### Event - `htmx:responseError` {#htmx:responseError}

This event is triggered when an HTTP error response occurs

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:sendAbort` {#htmx:sendAbort}

This event is triggered when a request is aborted

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:sendError` {#htmx:sendError}

This event is triggered when a network error prevents an HTTP request from occurring

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:sseError` {#htmx:sseError}

This event is triggered when an error occurs with an SSE source

##### Details

* `detail.elt` - the element with the bad SSE source
* `detail.error` - the error
* `detail.source` - the SSE source

### Event - `htmx:swapError` {#htmx:swapError}

This event is triggered when an error occurs during the swap phase

##### Details

* `detail.xhr` - the `XMLHttpRequest`
* `detail.elt` - the element that triggered the request
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:targetError` {#htmx:targetError}

This event is triggered when a bad selector is used for a [`hx-target`](@/attributes/hx-target.md) attribute (e.g. an
element ID without a preceding `#`)

##### Details

* `detail.elt` - the element that triggered the request
* `detail.target` - the bad CSS selector

### Event - `htmx:timeout` {#htmx:timeout}

This event is triggered when a request timeout occurs.  This wraps the typical `timeout` event of XMLHttpRequest.

Timeout time can be set using `htmx.config.timeout` or per element using [`hx-request`](@/attributes/hx-request.md)

##### Details

* `detail.elt` - the element that dispatched the request
* `detail.xhr` - the `XMLHttpRequest`
* `detail.target` - the target of the request
* `detail.requestConfig` - the configuration of the AJAX request

### Event - `htmx:trigger` {#htmx:trigger}

This event is triggered whenever an AJAX request would be, even if no AJAX request is specified. It
is primarily intended to allow `hx-trigger` to execute client-side scripts; AJAX requests have more
granular events available, like [`htmx:beforeRequest`](#htmx:beforeRequest) or [`htmx:afterRequest`](#htmx:afterRequest).

##### Details

* `detail.elt` - the element that triggered the request

### Event - `htmx:validateUrl` {#htmx:validateUrl}

This event is triggered before a request is made, allowing you to validate the URL that htmx is going to request.  If
`preventDefault()` is invoked on the event, the request will not be made.

```javascript
document.body.addEventListener('htmx:validateUrl', function (evt) {
  // only allow requests to the current server as well as myserver.com
  if (!evt.detail.sameHost && evt.detail.url.hostname !== "myserver.com") {
    evt.preventDefault();
  }
});
```

##### Details

* `detail.elt` - the element that triggered the request
* `detail.url` - the URL Object representing the URL that a request will be sent to.
* `detail.sameHost` - will be `true` if the request is to the same host as the document

### Event - `htmx:validation:validate` {#htmx:validation:validate}

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

* `detail.elt` - the element to be validated

### Event - `htmx:validation:failed` {#htmx:validation:failed}

This event is triggered when an element fails validation.

##### Details

* `detail.elt` - the element that failed validation
* `detail.message` - the validation error message
* `detail.validity` - the validity object, which contains properties specifying how validation failed

### Event - `htmx:validation:halted` {#htmx:validation:halted}

This event is triggered when a request is halted due to validation errors.

##### Details

* `detail.elt` - the element that triggered the request
* `detail.errors` - an array of error objects with the invalid elements and errors associated with them

### Event - `htmx:xhr:abort` {#htmx:xhr:abort}

This event is triggered when an ajax request aborts

##### Details

* `detail.elt` - the element that triggered the request

### Event - `htmx:xhr:loadstart` {#htmx:xhr:loadstart}

This event is triggered when an ajax request starts

##### Details

* `detail.elt` - the element that triggered the request

### Event - `htmx:xhr:loadend` {#htmx:xhr:loadend}

This event is triggered when an ajax request finishes

##### Details

* `detail.elt` - the element that triggered the request

### Event - `htmx:xhr:progress` {#htmx:xhr:progress}

This event is triggered periodically when an ajax request that supports progress is in flight

##### Details

* `detail.elt` - the element that triggered the request

+++
title = "Events"
+++

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>These docs are being updated for htmx 4.0. See <a href="/migration-guide-htmx-4#event-name-changes">the migration guide</a> for a complete mapping of htmx 2.x event names to htmx 4.x event names.</p>
</aside>

Htmx provides an extensive events system that can be used to modify and enhance behavior. Events are listed below.

**Note:** htmx 4.x uses a new event naming convention with the pattern `htmx:[phase]:[action]` (e.g., `htmx:before:request`, `htmx:after:swap`).

## Control Events

### Event - `htmx:abort` {#htmx:abort}

This event is different than other events: htmx does not *trigger* it, but rather *listens* for it.

If you send an `htmx:abort` event to an element making a request, it will abort the request:

```html
<button id="request-button" hx-post="/example">Issue Request</button>
<button onclick="htmx.trigger('#request-button', 'htmx:abort')">Cancel Request</button>
```

### Event - `htmx:confirm` {#htmx:confirm}

This event is fired on every trigger for a request (not just on elements that have a hx-confirm attribute).
It allows you to cancel (or delay) issuing the AJAX request.
If you call `preventDefault()` on the event, it will not issue the given request.
The `detail` object contains a function, `evt.detail.issueRequest(skipConfirmation=false)`, that can be used to issue the actual AJAX request at a later point.
Combining these two features allows you to create an asynchronous confirmation dialog.

```javascript
document.body.addEventListener('htmx:confirm', function(evt) {
  if (!evt.detail.target.hasAttribute('hx-confirm')) return;

  evt.preventDefault();

  // Your custom confirmation logic here
  if (confirm("Are you sure?")) {
    evt.detail.issueRequest(true); // true to skip built-in confirm
  }
});
```

##### Details

* `detail.elt` - the element in question
* `detail.issueRequest(skipConfirmation=false)` - function to issue the request
* `detail.path` - the path of the request
* `detail.target` - the element that triggered the request
* `detail.triggeringEvent` - the original event that triggered this request
* `detail.verb` - the verb of the request (e.g. `GET`)
* `detail.question` - the question from `hx-confirm` attribute (if present)

## Lifecycle Events

### Event - `htmx:before:init` {#htmx:before:init}

**Replaces:** `htmx:beforeProcessNode`, `htmx:beforeOnLoad`

This event is triggered before htmx initializes a DOM node and processes its `hx-` attributes.

##### Details

* `detail.elt` - the element being initialized

### Event - `htmx:after:init` {#htmx:after:init}

**Replaces:** `htmx:afterProcessNode`, `htmx:afterOnLoad`, `htmx:load`

This event is triggered after htmx has initialized a DOM node. Note that this event is also triggered when htmx is first initialized, with the document body as the target.

##### Details

* `detail.elt` - the newly initialized element

### Event - `htmx:before:cleanup` {#htmx:before:cleanup}

**Replaces:** `htmx:beforeCleanupElement`

This event is triggered before htmx disables or removes an element from the DOM.

##### Details

* `detail.elt` - the element to be cleaned up

### Event - `htmx:after:cleanup` {#htmx:after:cleanup}

This event is triggered after htmx has cleaned up an element.

##### Details

* `detail.elt` - the element that was cleaned up

## Request Events

### Event - `htmx:config:request` {#htmx:config:request}

**Replaces:** `htmx:configRequest`

This event is triggered before the request is made, allowing you to configure request parameters, headers, and other options.

```javascript
document.body.addEventListener('htmx:config:request', function(evt) {
  let ctx = evt.detail.ctx;
  // Modify request configuration
  ctx.request.headers['X-Auth-Token'] = getToken();
});
```

##### Details

* `detail.ctx` - the request context object containing:
  * `ctx.sourceElement` - the element that triggered the request
  * `ctx.request` - the request configuration with properties:
    * `action` - the URL
    * `method` - the HTTP method
    * `headers` - headers object
    * `body` - request body (FormData)
    * `credentials`, `mode`, `cache`, etc. - fetch options

### Event - `htmx:before:request` {#htmx:before:request}

**Replaces:** `htmx:beforeRequest`, `htmx:beforeSend`

This event is triggered before an AJAX request is issued. If you call `preventDefault()`, no request will occur.

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:after:request` {#htmx:after:request}

**Replaces:** `htmx:afterRequest`

This event is triggered after an AJAX request has completed (whether successful or not).

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:finally:request` {#htmx:finally:request}

This event is always triggered after a request completes, similar to a `finally` block. Useful for cleanup operations.

##### Details

* `detail.ctx` - the request context object

## Swap Events

### Event - `htmx:before:swap` {#htmx:before:swap}

**Replaces:** `htmx:beforeSwap`

This event is triggered before any new content has been swapped into the DOM.
If you call `preventDefault()`, no swap will occur.

You can modify swap behavior by setting properties on `detail.ctx`:

```javascript
document.body.addEventListener('htmx:before:swap', function(evt) {
  let ctx = evt.detail.ctx;
  // Modify swap behavior
  ctx.swap = 'outerHTML';
  ctx.target = document.querySelector('#other-target');
});
```

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:after:swap` {#htmx:after:swap}

**Replaces:** `htmx:afterSwap`, `htmx:afterSettle`

This event is triggered after new content has been swapped into the DOM.

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:before:oob:swap` {#htmx:before:oob:swap}

**Replaces:** `htmx:oobBeforeSwap`

This event is triggered before an out-of-band swap occurs.

##### Details

* `detail.ctx` - the request context object
* `detail.fragment` - the OOB fragment being swapped

### Event - `htmx:after:oob:swap` {#htmx:after:oob:swap}

**Replaces:** `htmx:oobAfterSwap`

This event is triggered after an out-of-band swap occurs.

##### Details

* `detail.ctx` - the request context object
* `detail.fragment` - the OOB fragment that was swapped

## History Events

### Event - `htmx:before:history:update` {#htmx:before:history:update}

**Replaces:** `htmx:beforeHistoryUpdate`, `htmx:beforeHistorySave`

This event is triggered before history is updated. You can modify the path or prevent the update.

##### Details

* `detail.ctx` - the request context object
* `detail.path` - the path to be saved in history

### Event - `htmx:after:history:update` {#htmx:after:history:update}

This event is triggered after history has been updated.

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:after:push:into:history` {#htmx:after:push:into:history}

**Replaces:** `htmx:pushedIntoHistory`

This event is triggered after a URL has been pushed into history.

##### Details

* `detail.path` - the path that was pushed

### Event - `htmx:after:replace:into:history` {#htmx:after:replace:into:history}

**Replaces:** `htmx:replacedInHistory`

This event is triggered after a URL has been replaced in history.

##### Details

* `detail.path` - the path that was replaced

### Event - `htmx:before:restore:history` {#htmx:before:restore:history}

**Replaces:** `htmx:historyCacheMiss`, `htmx:historyRestore`

This event is triggered before history restoration occurs (back/forward navigation).

##### Details

* `detail.path` - the path being restored

## Error Event

### Event - `htmx:error` {#htmx:error}

**Replaces:** `htmx:responseError`, `htmx:sendError`, `htmx:sendAbort`, `htmx:swapError`, `htmx:targetError`, `htmx:timeout`, `htmx:onLoadError`

This event consolidates all error events into a single event. It is triggered when an error occurs during any phase of the htmx request lifecycle.

```javascript
document.body.addEventListener('htmx:error', function(evt) {
  let ctx = evt.detail.ctx;
  console.error('Error:', ctx.status, evt.detail.error);
});
```

##### Details

* `detail.ctx` - the request context object containing:
  * `ctx.status` - a string describing the error
  * `ctx.response` - the response object (if available)
* `detail.error` - the error that occurred (if available)

## View Transition Events

### Event - `htmx:before:viewTransition` {#htmx:before:viewTransition}

**Replaces:** `htmx:beforeTransition`

This event is triggered before a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) wrapped swap occurs. If you call `preventDefault()`, the View Transition will not occur and normal swapping will happen instead.

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:after:viewTransition` {#htmx:after:viewTransition}

This event is triggered after a View Transition completes.

##### Details

* `detail.ctx` - the request context object

## Server-Sent Events (SSE)

### Event - `htmx:before:sse:stream` {#htmx:before:sse:stream}

This event is triggered before an SSE (Server-Sent Events) stream is processed. You can call `preventDefault()` to cancel the stream processing.

##### Details

* `detail.ctx` - the request context object
* `detail.stream` - the SSE stream configuration

### Event - `htmx:after:sse:stream` {#htmx:after:sse:stream}

This event is triggered after an SSE stream ends (either naturally or due to error/cancellation).

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:before:sse:message` {#htmx:before:sse:message}

This event is triggered before each SSE message is processed. You can set `detail.message.cancelled = true` to skip processing this message.

```javascript
document.body.addEventListener('htmx:before:sse:message', function(evt) {
  // Skip messages of certain type
  if (evt.detail.message.event === 'heartbeat') {
    evt.detail.message.cancelled = true;
  }
});
```

##### Details

* `detail.ctx` - the request context object
* `detail.message` - the SSE message object with properties:
  * `data` - the message data
  * `event` - the event type (if specified)
  * `id` - the message ID (if specified)
  * `cancelled` - set to `true` to skip this message

### Event - `htmx:after:sse:message` {#htmx:after:sse:message}

This event is triggered after an SSE message has been processed and swapped.

##### Details

* `detail.ctx` - the request context object
* `detail.message` - the SSE message object

### Event - `htmx:before:sse:reconnect` {#htmx:before:sse:reconnect}

This event is triggered before reconnecting to an SSE stream (when using `continuous` mode). You can set `detail.reconnect.cancelled = true` to prevent the reconnection.

```javascript
document.body.addEventListener('htmx:before:sse:reconnect', function(evt) {
  // Stop reconnecting after 10 attempts
  if (evt.detail.reconnect.attempt > 10) {
    evt.detail.reconnect.cancelled = true;
  }
});
```

##### Details

* `detail.ctx` - the request context object
* `detail.reconnect` - the reconnection configuration with properties:
  * `attempt` - the reconnection attempt number
  * `delay` - the delay before reconnection (in milliseconds)
  * `cancelled` - set to `true` to cancel the reconnection
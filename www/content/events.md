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
The `detail` object contains two functions: `evt.detail.issueRequest()` to confirm and issue the request, and `evt.detail.dropRequest()` to cancel it. This allows you to create an asynchronous confirmation dialog.

**Important:** If you call `preventDefault()`, you **must** call either `issueRequest()` or `dropRequest()` — failing to do so will leave the request pending indefinitely.

```javascript
document.body.addEventListener('htmx:confirm', function(evt) {
  if (!evt.detail.target.hasAttribute('hx-confirm')) return;

  evt.preventDefault();

  // Your custom confirmation logic here
  if (confirm("Are you sure?")) {
    evt.detail.issueRequest();
  } else {
    evt.detail.dropRequest();
  }
});
```

##### Details

* `detail.ctx` - the [request context](/extensions/building#request-context) object
* `detail.issueRequest()` - function to confirm and issue the request
* `detail.dropRequest()` - function to cancel the request

## Lifecycle Events

### Event - `htmx:before:init` {#htmx:before:init}

**Replaces:** `htmx:beforeProcessNode`, `htmx:beforeOnLoad`

This event is triggered before htmx initializes a DOM node and processes its `hx-` attributes.

##### Details

* `detail.elt` - the element being initialized

### Event - `htmx:after:init` {#htmx:after:init}

**Replaces:** `htmx:afterProcessNode`, `htmx:afterOnLoad`

This event is triggered after htmx has initialized a DOM node. Note that this event is also triggered when htmx is first initialized, with the document body as the target.

For processing new content (the old `htmx:load` use case), use `htmx:after:process` instead — that is the event `htmx.onLoad()` listens to.

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

### Event - `htmx:before:process` {#htmx:before:process}

This event is triggered before htmx processes an element and its descendants, setting up htmx behavior (triggers, boosting, hx-on attributes, etc.).

If you call `preventDefault()`, htmx will not process the element.

##### Details

* `detail.elt` - the element about to be processed

### Event - `htmx:after:process` {#htmx:after:process}

This event is triggered after htmx has finished processing an element and its descendants. This is useful for performing actions after htmx has set up all behaviors on new content.

```javascript
document.body.addEventListener('htmx:after:process', function(evt) {
  // Initialize 3rd party libraries on newly processed content
  initializeWidgets(evt.detail.elt);
});
```

##### Details

* `detail.elt` - the element that was processed

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

* `detail.ctx` - the [request context](/extensions/building#request-context) object containing:
  * `ctx.sourceElement` - the element that triggered the request
  * `ctx.request` - the request configuration with properties:
    * `action` - the URL
    * `method` - the HTTP method
    * `headers` - headers object
    * `body` - request body (FormData)
    * `credentials`, `mode`, `cache`, etc. - fetch options
  * `ctx.fetch` - the fetch function, [replaceable](/extensions/building#overriding-ctxfetch) for middleware/caching

### Event - `htmx:before:request` {#htmx:before:request}

**Replaces:** `htmx:beforeRequest`, `htmx:beforeSend`

This event is triggered before an AJAX request is issued. If you call `preventDefault()`, no request will occur.

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:before:response` {#htmx:before:response}

This event is triggered after a fetch response is received but before the response body is consumed. This allows extensions to intercept the raw response (e.g., to handle streaming content types like `text/event-stream`).

If you call `preventDefault()`, the normal response processing (body consumption, swap) will be skipped.

##### Details

* `detail.ctx` - the request context object containing:
  * `ctx.response.raw` - the raw [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object (body not yet consumed)
  * `ctx.response.status` - the HTTP status code
  * `ctx.response.headers` - the response headers

### Event - `htmx:after:request` {#htmx:after:request}

**Replaces:** `htmx:afterRequest`

This event is triggered after an AJAX request has completed (whether successful or not).

##### Details

* `detail.ctx` - the request context object

### Event - `htmx:finally:request` {#htmx:finally:request}

This event is always triggered after a request completes, similar to a `finally` block. Useful for cleanup operations.

##### Details

* `detail.ctx` - the request context object

## Caching Events

### Event - `htmx:etag:match` {#htmx:etag:match}

This event is triggered when a response's `ETag` header matches the stored ETag value for an element (when using `hx-config='etag:true'` or `hx-config='etag:"value"'`).

By default, when an ETag matches, htmx will abort the swap operation to prevent unnecessary DOM updates. You can override this behavior by calling `preventDefault()` to force the swap even when the ETag matches.

```javascript
document.body.addEventListener('htmx:etag:match', function(evt) {
  // Force swap even when ETag matches
  if (shouldForceUpdate()) {
    evt.preventDefault();
  }
});
```

##### Details

* `detail.ctx` - the request context object containing:
  * `ctx.sourceElement` - the element that made the request (where the ETag is stored)
  * `ctx.response` - the response object with the matching ETag
  * `ctx.text` - the cached response text
* `detail.responseETag` - the matching ETag value from the current response

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

### Event - `htmx:before:settle` {#htmx:before:settle}

This event is triggered before the settle phase begins, after content has been swapped into the DOM but before CSS transitions are applied.

##### Details

* `detail.task` - the swap task being settled
* `detail.newContent` - array of newly swapped content elements
* `detail.settleTasks` - array of settle tasks (e.g., CSS transition callbacks)

### Event - `htmx:after:settle` {#htmx:after:settle}

This event is triggered after the settle phase completes, including after any settle tasks (like CSS transitions) have finished.

##### Details

* `detail.task` - the swap task that was settled
* `detail.newContent` - array of newly settled content elements
* `detail.settleTasks` - array of settle tasks that were executed

## Morph Events

### Event - `htmx:before:morph:node` {#htmx:before:morph:node}

This event is triggered before each node is morphed during a morph swap (`innerMorph` or `outerMorph`).
You can cancel morphing of an individual node by calling `preventDefault()`.

This is an extension-only event — it is dispatched to extensions via hooks, not as a DOM event.

##### Details

* `detail.oldNode` - the existing DOM node
* `detail.newNode` - the incoming node it will be morphed into

## History Events

### Event - `htmx:before:history:update` {#htmx:before:history:update}

**Replaces:** `htmx:beforeHistoryUpdate`, `htmx:beforeHistorySave`

This event is triggered before history is updated. You can modify the path or prevent the update.

##### Details

* `detail.history` - object with `type` (`"push"` or `"replace"`) and `path`
* `detail.sourceElement` - the element that triggered the request
* `detail.response` - the response object

### Event - `htmx:after:history:update` {#htmx:after:history:update}

This event is triggered after history has been updated.

##### Details

* `detail.history` - object with `type` (`"push"` or `"replace"`) and `path`
* `detail.sourceElement` - the element that triggered the request
* `detail.response` - the response object

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

This event is triggered before a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) wrapped swap occurs.

##### Details

* `detail.task` - the swap function that will be executed within the view transition

### Event - `htmx:after:viewTransition` {#htmx:after:viewTransition}

This event is triggered after a View Transition completes.

##### Details

* `detail.ctx` - the request context object

## Server-Sent Events (SSE)

SSE is supported via the [SSE extension](/extensions/sse). See the [extension documentation](/extensions/sse#events) for SSE-specific events.
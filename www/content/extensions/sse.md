+++
title = "htmx Server-Sent Events (SSE) Extension"
+++

The SSE extension adds support for [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) streaming to htmx. It works by intercepting any htmx response with `Content-Type: text/event-stream` and streaming SSE messages into the DOM in real-time.

SSE is a lightweight alternative to WebSockets that works over existing HTTP connections, making it easy to use through proxy servers and firewalls. SSE is uni-directional: the server pushes data to the client. If you need bi-directional communication, consider [WebSockets](@/extensions/ws.md) instead.

## Installing

Just include the extension script after htmx:

```html
<head>
    <script src="/path/to/htmx.js"></script>
    <script src="/path/to/ext/hx-sse.js"></script>
</head>
```

## How It Works

The SSE extension hooks into htmx's request pipeline. When any htmx request receives a response with `Content-Type: text/event-stream`, the extension takes over and streams SSE messages into the DOM instead of performing a normal swap.

This means **any `hx-get`, `hx-post`, etc. that returns an SSE stream will just work**, no special attributes needed beyond loading the extension.

## `hx-sse:connect`

For persistent SSE connections (auto-connect on load, reconnect on failure), use `hx-sse:connect`:

```html
<!-- Auto-connects on load, streams messages into the div -->
<div hx-sse:connect="/stream">
    Waiting for messages...
</div>
```

`hx-sse:connect` is convenience sugar for a well-preconfigured `hx-get`. It defaults to:
- **Trigger**: `load` (connects immediately)
- **Reconnect**: enabled with exponential backoff
- **Pause on background**: closes the stream when the tab is backgrounded, reconnects when visible

### Using with Standard Attributes

`hx-sse:connect` works with all standard htmx attributes:

```html
<!-- Swap into a different target -->
<button hx-sse:connect="/notifications" hx-target="#alerts">
    Start Notifications
</button>
<div id="alerts"></div>

<!-- Append messages instead of replacing -->
<div hx-sse:connect="/log" hx-swap="beforeend">
    <h3>Log:</h3>
</div>
```

### Trigger Modifiers

All standard `hx-trigger` modifiers are supported:

```html
<!-- Connect after a delay -->
<div hx-sse:connect="/stream" hx-trigger="load delay:2s">

<!-- Connect on click -->
<button hx-sse:connect="/stream" hx-trigger="click">Start</button>

<!-- Connect on click, only once -->
<button hx-sse:connect="/stream" hx-trigger="click once">Start</button>
```

### Using Standard htmx Attributes

Since the extension intercepts based on Content-Type, any htmx request that returns `text/event-stream` will be streamed automatically:

```html
<!-- hx-get, hx-post, etc. all work -->
<div hx-get="/stream" hx-trigger="load">
    Waiting...
</div>

<button hx-post="/generate" hx-target="#output">
    Generate
</button>
```

The difference is that `hx-sse:connect` enables reconnection and `pauseOnBackground` by default, while standard attributes do not.

## `hx-sse:close`

Use `hx-sse:close` to gracefully close an SSE connection when a specific named event is received from the server:

```html
<div hx-sse:connect="/stream" hx-sse:close="done">
    Streaming until server sends "done"...
</div>
```

When the server sends `event: done`, the connection is closed and an `htmx:sse:close` event is fired with `detail.reason === "message"`.

## Named Events

SSE messages with an `event:` field are dispatched as DOM events on the source element rather than being swapped:

```txt
event: notification
data: {"title": "New message", "body": "Hello!"}
```

```html
<div hx-sse:connect="/events"
     hx-on:notification="alert(event.detail.data)">
</div>
```

Messages without an `event:` field are swapped into the DOM as HTML content.

## Configuration

Configure SSE behavior globally via `htmx.config.sse` or per-element via `hx-config`:

```html
<!-- Global config -->
<meta name="htmx-config" content='{
    "sse": {
        "reconnect": true,
        "reconnectDelay": 500,
        "reconnectMaxDelay": 60000,
        "reconnectMaxAttempts": 50,
        "reconnectJitter": 0.3,
        "pauseOnBackground": false
    }
}'>

<!-- Per-element override -->
<div hx-sse:connect="/stream" hx-config='{"sse": {"reconnect": false}}'>
```

| Option | Default (`hx-sse:connect`) | Default (`hx-get`) | Description |
|--------|---------------------------|---------------------|-------------|
| `reconnect` | `true` | `false` | Auto-reconnect on stream end |
| `reconnectDelay` | `500` | `500` | Initial reconnect delay (ms) |
| `reconnectMaxDelay` | `60000` | `60000` | Maximum reconnect delay (ms) |
| `reconnectMaxAttempts` | `Infinity` | `Infinity` | Maximum reconnection attempts |
| `reconnectJitter` | `0.3` | `0.3` | Jitter factor (0-1) for delay randomization |
| `pauseOnBackground` | `true` | `false` | Close the stream when the tab is backgrounded, reconnect when visible |

### Reconnection Strategy

The extension uses exponential backoff with jitter:

- **Formula**: `delay = min(reconnectDelay × 2^(attempt-1), reconnectMaxDelay)`
- **Jitter**: Adds ±`reconnectJitter` randomization to avoid thundering herd
- **Last-Event-ID**: Automatically sent on reconnection if the server provided message IDs

## Events

### `htmx:before:sse:connection`

Fired before a connection attempt (initial or reconnection). Set `detail.connection.cancelled = true` to prevent the connection.

For reconnections (`detail.connection.attempt > 0`), you can also modify `detail.connection.delay` to change the backoff delay.

```javascript
document.body.addEventListener('htmx:before:sse:connection', function(evt) {
    if (evt.detail.connection.attempt > 10) {
        evt.detail.connection.cancelled = true;
    }
});
```

* `detail.connection.attempt` - attempt number (`0` = initial, `> 0` = reconnection)
* `detail.connection.delay` - the delay before connection (ms), modifiable
* `detail.connection.url` - the SSE endpoint URL
* `detail.connection.lastEventId` - the last event ID received
* `detail.connection.cancelled` - set to `true` to cancel

### `htmx:after:sse:connection`

Fired after a successful connection (or reconnection) to the SSE stream.

* `detail.connection.attempt` - attempt number (`0` = initial, `> 0` = reconnection)
* `detail.connection.url` - the SSE endpoint URL
* `detail.connection.status` - the HTTP status code
* `detail.connection.lastEventId` - the last event ID received

### `htmx:before:sse:message`

Fired before each SSE message is processed. All fields are modifiable. Changes to `data` or `event` affect how the message is handled.

```javascript
document.body.addEventListener('htmx:before:sse:message', function(evt) {
    // Skip heartbeats
    if (evt.detail.message.event === 'heartbeat') {
        evt.detail.message.cancelled = true;
    }

    // Transform data before swap
    evt.detail.message.data = sanitize(evt.detail.message.data);
});
```

* `detail.message.data` - the message data (modifiable)
* `detail.message.event` - the event type (modifiable)
* `detail.message.id` - the message ID (if specified)
* `detail.message.cancelled` - set to `true` to skip

### `htmx:after:sse:message`

Fired after an SSE message has been processed.

* `detail.message` - same shape as `htmx:before:sse:message`

### `htmx:sse:error`

Fired when a stream error occurs.

* `detail.error` - the error object

### `htmx:sse:close`

Fired when an SSE connection is closed.

* `detail.reason` - why the connection was closed:
  * `"message"` - closed by `hx-sse:close` matching a named event
  * `"removed"` - the element was removed from the DOM
  * `"ended"` - the stream ended naturally or reconnection was exhausted
  * `"cancelled"` - the initial connection was cancelled via `htmx:before:sse:connection`
  * `"cleanup"` - closed during element cleanup (e.g., parent swap)

## Upgrading from htmx 2.x

The htmx 2.x SSE extension (`htmx-ext-sse`) has been rewritten for htmx 4.

### What Changed

The 2.x extension was built around `EventSource` and had its own swap mechanism (`sse-swap`) that operated
outside of htmx's normal request/response pipeline. The 4.x extension removes all of that. It hooks into
htmx's standard request pipeline instead: any htmx request that receives a `Content-Type: text/event-stream`
response is automatically streamed as SSE. Swapping uses the same `hx-swap`, `hx-target`, etc. attributes
as any other htmx response.

This means:
- **Unnamed messages** (no `event:` field) are swapped into the DOM using htmx's normal swap pipeline.
- **Named messages** (with an `event:` field) are dispatched as DOM events on the source element. They are not swapped.
- `sse-swap` is gone entirely. There is no equivalent, because the extension no longer has its own swap system.

### Connecting and Swapping

**htmx 2.x:**
```html
<div sse-connect="/chatroom" sse-swap="message">
    Contents of this box will be updated in real time
    with every SSE message received from the chatroom.
</div>
```

**htmx 4.x:**
```html
<div hx-sse:connect="/chatroom">
    Contents of this box will be updated in real time
    with every SSE message received from the chatroom.
</div>
```

`hx-sse:connect` replaces `sse-connect`. Unnamed messages are swapped automatically
using htmx's normal swap pipeline, so `sse-swap="message"` is no longer needed.

### Named Events

In the 2.x extension, `sse-swap="EventName"` would swap the data from a named event directly into an element.
In the 4.x extension, named events are not swapped. They are dispatched as DOM events on the source element
and bubble up the DOM. You can use them to trigger htmx requests:

**htmx 2.x:**
```html
<div sse-connect="/event-stream">
    <div hx-get="/chatroom" hx-trigger="sse:chatter">
        ...
    </div>
</div>
```

**htmx 4.x:**
```html
<div hx-sse:connect="/event-stream">
    <div hx-get="/chatroom" hx-trigger="chatter from:body">
        ...
    </div>
</div>
```

Named SSE events become regular DOM events, no `sse:` prefix needed. Since events are dispatched on the
source element and bubble up (not down to children), child elements use `from:body` to listen.

### Closing a Connection

**htmx 2.x:**
```html
<div sse-connect="/stream" sse-close="done">
    Streaming until server sends "done"...
</div>
```

**htmx 4.x:**
```html
<div hx-sse:connect="/stream" hx-sse:close="done">
    Streaming until server sends "done"...
</div>
```

### Event Changes

| htmx 2.x Event             | htmx 4.x Event                    | Notes                                        |
|-----------------------------|------------------------------------|----------------------------------------------|
| `htmx:sseOpen`             | `htmx:after:sse:connection`        | `detail.connection.attempt === 0` for initial |
| `htmx:sseError`            | `htmx:sse:error`                   | `detail.error` contains the error             |
| `htmx:sseBeforeMessage`    | `htmx:before:sse:message`          | Set `detail.message.cancelled = true` to skip |
| `htmx:sseMessage`          | `htmx:after:sse:message`           |                                               |
| `htmx:sseClose`            | `htmx:sse:close`                   | `detail.reason` indicates why                 |

### Other Changes

* **No more `EventSource`**: uses `fetch()` + `ReadableStream`, enabling POST requests, custom headers, and cookies.
* **Reconnection**: `hx-sse:connect` reconnects automatically with exponential backoff. Configure via `hx-config`.
* **Background tab handling**: pauses streams when the tab is backgrounded, reconnects when visible (configurable via `pauseOnBackground`).
* **Any HTTP method**: `hx-post`, `hx-put`, etc. all work with SSE responses. The extension intercepts any response with `Content-Type: text/event-stream`.

## Additional Resources

* [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
* [HTML Spec: Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)

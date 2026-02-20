+++
title = "htmx Server-Sent Events (SSE) Extension"
+++

The SSE extension adds support for [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) streaming to htmx. It works by intercepting any htmx response with `Content-Type: text/event-stream` and streaming SSE messages into the DOM in real-time.

SSE is a lightweight alternative to WebSockets that works over existing HTTP connections, making it easy to use through proxy servers and firewalls. SSE is uni-directional — the server pushes data to the client. If you need bi-directional communication, consider [WebSockets](@/extensions/ws.md) instead.

## Installing

Include the extension script after htmx and approve it:

```html
<head>
    <script src="/path/to/htmx.js"></script>
    <script src="/path/to/ext/hx-sse.js"></script>
</head>
```

Approve the extension via meta tag:

```html
<meta name="htmx-config" content='{"extensions": "sse"}'>
```

## How It Works

The SSE extension hooks into htmx's request pipeline. When any htmx request receives a response with `Content-Type: text/event-stream`, the extension takes over and streams SSE messages into the DOM instead of performing a normal swap.

This means **any `hx-get`, `hx-post`, etc. that returns an SSE stream will just work** — no special attributes needed beyond loading the extension.

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
- **Close on hide**: closes the stream when the tab is hidden, reconnects when visible

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

### Using `hx-get` Directly

Since the extension intercepts based on Content-Type, you can use `hx-get` directly:

```html
<!-- Equivalent to hx-sse:connect="/stream" -->
<div hx-get="/stream" hx-trigger="load">
    Waiting...
</div>
```

The difference is that `hx-sse:connect` enables reconnection and close-on-hide by default, while `hx-get` does not.

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
        "reconnectMaxAttempts": "Infinity",
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
| `pauseOnBackground` | `true` | `false` | Pause connection when tab is backgrounded |

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
* `detail.connection.lastEventId` - the last event ID received
* `detail.connection.cancelled` - set to `true` to cancel

### `htmx:after:sse:connection`

Fired after a successful connection (or reconnection) to the SSE stream.

* `detail.url` - the URL that was connected to
* `detail.status` - the HTTP status code

### `htmx:before:sse:message`

Fired before each SSE message is processed. Set `detail.message.cancelled = true` to skip this message.

```javascript
document.body.addEventListener('htmx:before:sse:message', function(evt) {
    if (evt.detail.message.event === 'heartbeat') {
        evt.detail.message.cancelled = true;
    }
});
```

* `detail.message.data` - the message data
* `detail.message.event` - the event type (if specified)
* `detail.message.id` - the message ID (if specified)
* `detail.message.cancelled` - set to `true` to skip

### `htmx:after:sse:message`

Fired after an SSE message has been processed.

* `detail.message` - same shape as `htmx:before:sse:message`

### `htmx:sse:error`

Fired when a stream error occurs.

* `detail.error` - the error object

## Additional Resources

* [MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
* [HTML Spec: Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html)

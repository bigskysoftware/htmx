---
title: "Server-Sent Events (SSE)"
description: "Stream server updates using Server-Sent Events"
keywords: ["sse", "server-sent events", "event stream", "streaming", "real-time"]
---

The SSE extension adds support for [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) streaming to htmx. It works by intercepting any htmx response with `Content-Type: text/event-stream` and streaming SSE messages into the DOM in real-time.

SSE is a lightweight alternative to WebSockets that works over existing HTTP connections, making it easy to use through proxy servers and firewalls. SSE is uni-directional: the server pushes data to the client. If you need bi-directional communication, consider [WebSockets](/docs/extensions/ws) instead.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-sse.js"></script>
```

## How It Works

The SSE extension hooks into htmx's request pipeline. When any htmx request receives a response with `Content-Type: text/event-stream`, the extension takes over and streams SSE messages into the DOM instead of performing a normal swap.

This means **any [`hx-get`](/reference/attributes/hx-get), [`hx-post`](/reference/attributes/hx-post), etc. that returns an SSE stream will just work**, no special attributes needed beyond loading the extension.

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

All standard [`hx-trigger`](/reference/attributes/hx-trigger) modifiers are supported:

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

Configure SSE behavior globally via `htmx.config.sse` or per-element via [`hx-config`](/reference/attributes/hx-config):

```javascript
htmx.config.sse = {
    reconnect: true,              // Auto-reconnect on stream end (default: true for hx-sse:connect, false for hx-get)
    reconnectDelay: 500,          // Initial reconnect delay in ms (default: 500)
    reconnectMaxDelay: 60000,     // Maximum reconnect delay in ms (default: 60000)
    reconnectMaxAttempts: Infinity,// Maximum reconnection attempts (default: Infinity)
    reconnectJitter: 0.3,         // Jitter factor 0-1 for delay randomization (default: 0.3)
    pauseOnBackground: true       // Disconnect when tab is backgrounded (default: true for hx-sse:connect, false for hx-get)
};
```

```html
<!-- Per-element override -->
<div hx-sse:connect="/stream" hx-config="sse.reconnectDelay:1s sse.reconnectMaxAttempts:50">
```

Delay values accept time strings: `"500ms"`, `"1s"`, `"2m"`, or raw milliseconds.

Defaults for `reconnect` and `pauseOnBackground` depend on how the SSE connection is established:

| Option | Default (`hx-sse:connect`) | Default (`hx-get`) | Description |
|--------|---------------------------|---------------------|-------------|
| `reconnect` | `true` | `false` | Auto-reconnect on stream end |
| `reconnectDelay` | `500` | `500` | Initial reconnect delay (ms) |
| `reconnectMaxDelay` | `60000` | `60000` | Maximum reconnect delay (ms) |
| `reconnectMaxAttempts` | `Infinity` | `Infinity` | Maximum reconnection attempts |
| `reconnectJitter` | `0.3` | `0.3` | Jitter factor (0-1) for delay randomization |
| `pauseOnBackground` | `true` | `false` | Disconnect when tab is backgrounded, reconnect when visible (see [Background Tab Behavior](#background-tab-behavior)) |

### Reconnection Strategy

The extension uses exponential backoff with jitter:

- **Formula**: `delay = min(reconnectDelay × 2^(attempt-1), reconnectMaxDelay)`
- **Jitter**: Adds ±`reconnectJitter` randomization to avoid thundering herd
- **Last-Event-ID**: Automatically sent on reconnection if the server provided message IDs (see [Background Tab Behavior](#background-tab-behavior))

### Background Tab Behavior

When `pauseOnBackground` is enabled (the default for `hx-sse:connect`), the extension disconnects the
stream when the browser tab is hidden and reconnects when the tab becomes visible again. This exists
because some browsers (notably iOS Safari) silently kill SSE connections when the app is backgrounded
without firing any error events, leaving the connection in a zombie state.

**Messages sent by the server while the tab is in the background are not received by the client.** Whether
those messages can be recovered depends on your server:

- If the server includes `id:` fields in its SSE messages, the extension tracks the last received ID and
  sends it as a `Last-Event-ID` header when reconnecting.
- If the server reads the `Last-Event-ID` header and replays missed messages, nothing is lost.
- If the server does not send `id:` fields or does not support `Last-Event-ID`, messages sent during the
  background period are lost.

#### Example: Resumable Notifications Stream

**Server** (Python with FastAPI + sse-starlette):

```python
from fastapi import FastAPI, Request
from sse_starlette.sse import EventSourceResponse

app = FastAPI()
notifications = []  # In production, use a database

@app.get("/notifications")
async def sse(request: Request):
    last_id = request.headers.get("last-event-id")

    async def stream():
        # Replay any missed messages
        start = 0
        if last_id:
            for i, n in enumerate(notifications):
                if str(n["id"]) == last_id:
                    start = i + 1
                    break
            for n in notifications[start:]:
                yield {"id": str(n["id"]), "data": n["data"]}

        # Stream new messages as they arrive
        seen = len(notifications)
        while True:
            if len(notifications) > seen:
                for n in notifications[seen:]:
                    yield {"id": str(n["id"]), "data": n["data"]}
                seen = len(notifications)
            await asyncio.sleep(0.5)

    return EventSourceResponse(stream())
```

**Client:**

```html
<div hx-sse:connect="/notifications" hx-swap="beforeend">
    <!-- Notifications appear here -->
</div>
```

When the user switches tabs and comes back, the extension reconnects with
`Last-Event-ID: <last-received-id>`, and the server replays any notifications
that were sent in the meantime.

## Events

### Connection Lifecycle

| Event | Cancelable | Detail | Description |
|-------|------------|--------|-------------|
| `htmx:before:sse:connection` | ✅ | `{connection}` | Before connection attempt (initial or reconnect) |
| `htmx:after:sse:connection` | ❌ | `{connection}` | After successful connection |
| `htmx:sse:close` | ❌ | `{connection, reason}` | When connection closes (see below) |
| `htmx:sse:error` | ❌ | `{error, url, status}` | On stream error |

The `connection` detail is the actual internal connection object, which includes:
- `attempt`: `0` for initial connection, `> 0` for reconnections
- `url`: the SSE endpoint URL
- `config`: the resolved configuration for this connection
- `lastEventId`: the last event ID received
- `status`: the HTTP status code (available on `after` events)
- `cancelled`: set to `true` in `before` events to cancel the connection

The `htmx:sse:close` detail includes:
- `connection`  - the connection object
- `reason`  - why the connection closed:
  - `"message"`  - closed by `hx-sse:close` matching a named event
  - `"removed"`  - the element was removed from the DOM
  - `"ended"`  - the stream ended naturally or reconnection was exhausted
  - `"cancelled"`  - the initial connection was cancelled via `htmx:before:sse:connection`
  - `"cleanup"`  - closed during element cleanup (e.g., parent swap)

The `htmx:sse:error` detail includes:
- `error`: the error object
- `url`: the SSE endpoint URL
- `status`: the HTTP status code (only present for non-2xx reconnect responses)

### Message Events

| Event | Cancelable | Detail | Description |
|-------|------------|--------|-------------|
| `htmx:before:sse:message` | ✅ | `{message: {data, event, id, cancelled}}` | Before processing an SSE message |
| `htmx:after:sse:message` | ❌ | `{message: {data, event, id}}` | After processing an SSE message |

The `message` detail includes:
- `data`: the message data (modifiable)
- `event`: the event type (modifiable)
- `id`: the message ID (if specified)
- `cancelled`: set to `true` in the `before` event to skip processing

### Event Examples

**Cancel Connection Based on Condition:**
```javascript
document.body.addEventListener('htmx:before:sse:connection', function(evt) {
    if (evt.detail.connection.attempt > 10) {
        evt.detail.connection.cancelled = true;
    }
});
```

**Skip Heartbeat Messages:**
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

## Examples

### LLM Streaming Response

A one-off stream using `hx-post`  - the server returns `text/event-stream` and the extension handles it automatically:

```html
<form hx-post="/chat" hx-target="#response" hx-swap="innerHTML">
    <textarea name="prompt" placeholder="Ask something..."></textarea>
    <button type="submit">Send</button>
</form>
<div id="response"></div>
```

The server streams tokens as SSE messages. Each message replaces the target content, so the user sees the response being "typed" in real-time. `hx-sse:connect` is not needed here. The extension enables streaming via normal `hx-post` (or `hx-get`, `hx-put`, etc.) attributes, based on the response `Content-Type` header.

### Live Event Bus

A persistent connection that pushes targeted updates anywhere on the page using [`<hx-partial>`](/docs/core-concepts/multi-target-updates#partials-hx-partial):

```html
<div hx-sse:connect="/events"></div>

<!-- These can be anywhere on the page -->
<div id="feed"></div>
<div id="status"></div>
```

The server uses `<hx-partial>` with `hx-target` to control where each message goes:
```
data: <hx-partial hx-target="#feed" hx-swap="beforeend"><div class="event">User joined</div></hx-partial>

data: <hx-partial hx-target="#feed" hx-swap="beforeend"><div class="event">New comment</div></hx-partial>

data: <hx-partial hx-target="#status"><span>3 users online</span></hx-partial>
```

Each `<hx-partial>` targets any element in the DOM via `hx-target` (or `id` as a shorthand). The connection element itself doesn't need `hx-target` or `hx-swap` - the server controls where content goes.

### Dashboard with Named Events

Use named SSE events to route different data types to JavaScript handlers:

```html
<div hx-sse:connect="/dashboard"
     hx-on:cpu="htmx.find('#cpu').textContent = event.detail.data"
     hx-on:memory="htmx.find('#memory').textContent = event.detail.data">
    <div>CPU: <span id="cpu">--</span></div>
    <div>Memory: <span id="memory">--</span></div>
</div>
```

Server sends named events:
```
event: cpu
data: 45%

event: memory
data: 2.3 GB
```

Named events are dispatched as DOM events (not swapped), so you handle them with `hx-on` or `addEventListener`.

## Upgrading from htmx 2.x

The htmx 2.x SSE extension (`htmx-ext-sse`) has been rewritten for htmx 4.

### What Changed

The 2.x extension was built around `EventSource` and had its own swap mechanism (`sse-swap`) that operated outside of htmx's normal request/response pipeline. The 4.x extension removes all of that. It hooks into htmx's standard request pipeline instead: any htmx request that receives a `Content-Type: text/event-stream` response is automatically streamed as SSE.

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

The old `sse-connect` and `sse-close` attributes still work but emit a deprecation warning.

### Event Changes

| htmx 2.x Event | htmx 4.x Event | Notes |
|-----------------|-----------------|-------|
| `htmx:sseOpen` | `htmx:after:sse:connection` | `detail.connection.attempt === 0` for initial |
| `htmx:sseError` | `htmx:sse:error` | `detail.error` contains the error |
| `htmx:sseBeforeMessage` | `htmx:before:sse:message` | Set `detail.message.cancelled = true` to skip |
| `htmx:sseMessage` | `htmx:after:sse:message` | |
| `htmx:sseClose` | `htmx:sse:close` | `detail.reason` indicates why |

### Other Changes

- **No more `EventSource`**: uses `fetch()` + `ReadableStream`, enabling POST requests, custom headers, and cookies.
- **Reconnection**: `hx-sse:connect` reconnects automatically with exponential backoff. Configure via `hx-config`.
- **Background tab handling**: pauses streams when the tab is backgrounded, reconnects when visible (configurable via `pauseOnBackground`).
- **Any HTTP method**: `hx-post`, [`hx-put`](/reference/attributes/hx-put), etc. all work with SSE responses.

---
title: "hx-sse"
description: "Stream HTML with `text/event-stream` (SSE)"
category: "Networking"
icon: "icon-[mdi--rss]"
keywords: ["sse", "server-sent events", "server sent events", "event stream", "streaming", "real-time"]
---

The `hx-sse` extension lets one HTTP response stream many [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

If you used [`sse`](https://htmx.org/extensions/sse/) in htmx 2.0, see [migration notes](#migration).

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-sse.min.js"></script>
```

## Usage

### Update an Element

Start with a typical htmx request using [`hx-get`](/reference/attributes/hx-get):

```html
<button hx-get="/ping">
  Ping
</button>
```

Instead of `text/html`, respond with [`text/event-stream`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events):

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: Pong

```

This unnamed event has a `data:` field but no `event:` field.

<details>
<summary>Backend libraries</summary>

- **Python:** [FastAPI](https://fastapi.tiangolo.com/tutorial/server-sent-events/) or [`sse-starlette`](https://github.com/sysid/sse-starlette)
- **Go:** [`go-sse`](https://github.com/tmaxmax/go-sse)
- **PHP:** [Laravel event streams](https://laravel.com/docs/13.x/responses#event-streams)

</details>

The event replaces the button's content:

```html
<button hx-get="/ping">
  Pong
</button>
```

htmx uses the same rules as with a `text/html` response:

- [`hx-target="this"`](/reference/attributes/hx-target#this)
- [`hx-swap="innerHTML"`](/reference/attributes/hx-swap#innerhtml) (from [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap))

**Stream an Update**

You can also stream HTML using multiple unnamed events:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: P

data: Po

data: Pon

data: Pong

```

The button changes as each event arrives:

`Ping` → `P` → `Po` → `Pon` → `Pong`

**Choose the Swap**

Use [`hx-swap`](/reference/attributes/hx-swap) and [`hx-target`](/reference/attributes/hx-target) to choose how and where updates swap:

```html
<button hx-post="/generate"
        hx-target="next output"
        hx-swap="beforeend">
  Generate
</button>

<!-- LLM tokens stream here -->
<output></output>
```

Each unnamed event contains one text chunk:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: Hello

data: , world

data: !

```

[`hx-swap="beforeend"`](/reference/attributes/hx-swap#beforeend--append) accumulates them in `<output>`:

```html
<output>Hello, world!</output>
```

You can also use:

- [`hx-select`](/reference/attributes/hx-select) to select content for the swap
- [`hx-select-oob`](/reference/attributes/hx-select-oob) to select more elements to swap

### Update Elements

Use a normal htmx request to update several elements:

```html
<button hx-get="/events">Connect</button>

<div id="feed"></div>
<div id="status">Offline</div>
```

The server sends two extra swaps using [`hx-swap-oob`](/reference/attributes/hx-swap-oob) and [`<hx-partial>`](/reference/tags/hx-partial):

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: <div id="status" hx-swap-oob="true">Online</div>
data: <hx-partial hx-target="#feed"><p>New</p></hx-partial>

```

The page becomes:

```html
<button hx-get="/events">Connect</button>

<div id="feed">
  <p>New</p>
</div>
<div id="status">Online</div>
```

<details>
<summary>Why wasn't the normal swap used?</summary>

After htmx extracts the extra swaps, the normal swap is empty:

```text
(empty)
```

[`hx-swap-oob`](/reference/attributes/hx-swap-oob) and [`<hx-partial>`](/reference/tags/hx-partial) elements are extracted before the normal swap. By default, [`swapEmpty:false`](/reference/attributes/hx-swap#swapempty) leaves the connection element unchanged.

The server can mix extra swaps with ordinary HTML:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: <p>New event</p>
data: <hx-partial hx-target="#status">Busy</hx-partial>

```

The paragraph follows `hx-target` and `hx-swap` on the request element. The partial updates `#status`.

To disable the request element's swap, set `hx-swap="none"`:

```html
<button hx-get="/events" hx-swap="none">Connect</button>
```

[`hx-swap-oob`](/reference/attributes/hx-swap-oob) and [`<hx-partial>`](/reference/tags/hx-partial) swaps still run.

</details>

### Persistent Connections

Use a persistent connection to keep receiving server updates.

#### Open Connections

Add [`hx-sse:connect`](#hx-sseconnect) to the element that receives them:

```html
<div hx-sse:connect="/events"></div>
```

Use [`hx-trigger`](/reference/attributes/hx-trigger) to connect after an event:

```html
<button id="connect">Connect</button>

<div hx-sse:connect="/events"
     hx-trigger="click from:#connect">
</div>
```

All [`hx-trigger` modifiers](/reference/attributes/hx-trigger#event-modifiers) are supported.

#### Close Connections

Close a connection when a specific named event arrives:

```html
<div hx-sse:connect="/progress" hx-sse:close="done"></div>
```

The server sends:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

event: done
data: Complete

```

Client handlers for the `done` event run before the connection closes.

#### Configure Connections

You can configure `hx-sse` in three places:

- **[`<meta name="htmx-config">`](/reference/config/htmx-config#configure-via-meta-tag)** sets global defaults from HTML.

  ```html
  <meta name="htmx-config"
        content="sse.reconnectDelay:1s sse.reconnectMaxAttempts:5">
  ```

- **[`htmx.config.sse`](#config)** sets global defaults from JavaScript.

  ```js
  htmx.config.sse.reconnectDelay = '1s'
  htmx.config.sse.reconnectMaxAttempts = 5
  ```

- **[`hx-config`](/reference/attributes/hx-config)** overrides the defaults for one connection.

  ```html
  <div hx-sse:connect="/events"
       hx-config="sse.reconnectMaxAttempts:2">
  </div>
  ```

These values are read when stream handling begins.

### Replay Messages

Add [`id:`](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#id) to recover messages missed while disconnected:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

id: event-42
data: <p>New message</p>

```

The stream keeps the current event ID:

- An event without `id` inherits the current ID.
- An empty `id:` clears the ID.
- An ID-only block ending with a blank line updates or clears the ID without dispatching a message.

On reconnect, `hx-sse` includes [`Last-Event-ID`](#last-event-id) when the current ID is not empty:

```http
Last-Event-ID: event-42
```

This tells the server where the client left off, so it can replay missed messages.

```text
Server                          Client

event-42  ------------------->  received
event-43  --------X             disconnected
          <-------------------  Last-Event-ID: event-42
event-43  ------------------->  replayed
```

The server decides which messages to replay. `hx-sse` processes every event it receives and does not deduplicate replays.

### Trigger Client Events

An SSE `event` field dispatches a DOM event instead of swapping its data:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

event: progress
data: 50
id: task-5

```

Handle it with [`hx-on`](/reference/attributes/hx-on):

```html
<button hx-get="/progress"
        hx-on:progress="htmx.find('#progress').value = event.detail.data">
  Start
</button>

<progress id="progress" max="100" value="0"></progress>
```

The event bubbles from the request source and exposes:

```js
event.detail = {
  data: '50',
  id: 'task-5'
}
```

A named event can also trigger another htmx request:

```html
<div hx-get="/status" hx-trigger="progress from:body"></div>
```

## Attributes

### `hx-get`/`hx-post`/`hx-put`/...

The `hx-sse` extension enhances:

- [`hx-get`](/reference/attributes/hx-get)
- [`hx-post`](/reference/attributes/hx-post)
- [`hx-put`](/reference/attributes/hx-put)
- [`hx-patch`](/reference/attributes/hx-patch)
- [`hx-delete`](/reference/attributes/hx-delete)
- [`hx-action`](/reference/attributes/hx-action) with [`hx-method`](/reference/attributes/hx-method)

When a response uses `Content-Type: text/event-stream`, htmx processes each SSE event as it arrives.

### `hx-sse:connect`

Opens a persistent SSE connection with a GET request:

```html
<div hx-sse:connect="/events"></div>
```

The connection uses:

- [`hx-headers`](/reference/attributes/hx-headers) and [`hx-vals`](/reference/attributes/hx-vals) for the GET request
- [`hx-target`](/reference/attributes/hx-target), [`hx-swap`](/reference/attributes/hx-swap), [`hx-select`](/reference/attributes/hx-select), and [`hx-select-oob`](/reference/attributes/hx-select-oob) for each message

Defaults:

- [`hx-trigger="load"`](/reference/attributes/hx-trigger#load)
- [`sse.reconnect:true`](#ssereconnect)
- [`sse.pauseOnBackground:true`](#ssepauseonbackground)
- [`sse.releaseOn:immediate`](#ssereleaseon)
- [`swapEmpty:false`](/reference/attributes/hx-swap#swapempty) for each message

### `hx-sse:close`

Closes the connection after a matching named event:

```html
<div hx-sse:connect="/events" hx-sse:close="done"></div>
```

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

event: done
data: Complete

```

## Headers

### `Accept`

Advertises SSE support on every htmx request while the extension is loaded.

```http
Accept: text/html, text/event-stream
```

A response is streamed when its `Content-Type` contains `text/event-stream`.

### `Last-Event-ID`

Identifies the last received SSE event during reconnection.

```http
Last-Event-ID: event-42
```

The extension sends this header while the current event ID is not empty. Events without `id` inherit that ID, while an empty `id:` removes the header from later reconnects.

The server decides how to replay later messages. The client does not deduplicate them.

## Events

Event data is available on `event.detail`.

Connection events expose:

```js
event.detail.connection = {
  url,
  config,
  lastEventId,
  attempt,
  status,
  cancelled
}
```

Message events expose:

```js
event.detail = {
  connection,
  message: {
    data,
    event,
    id
  },
  waitUntil(), // before processing only
  cancelled    // before processing only
}
```

### `htmx:sse:before:connection`

Fires before htmx starts the initial stream or schedules a reconnect.

```js
document.addEventListener('htmx:sse:before:connection', event => {
  if (event.detail.connection.attempt > 5) event.preventDefault()
})
```

The initial HTTP response has already arrived. Cancel either way:

- call `event.preventDefault()`
- set `event.detail.connection.cancelled` to `true`

### `htmx:sse:after:connection`

Fires after the initial response or a reconnect is ready to stream.

```js
document.addEventListener('htmx:sse:after:connection', event => {
  console.log('Connected:', event.detail.connection.url)
})
```

`connection.status` contains the HTTP status.

### `htmx:sse:before:message`

Fires before processing an SSE message.

```js
document.addEventListener('htmx:sse:before:message', event => {
  let message = event.detail.message
  if (message.event === 'heartbeat') event.preventDefault()
  else message.data = sanitize(message.data)
})
```

Changing `message.data` changes the swap or named event data. Changing `message.event` changes whether the message swaps or dispatches a DOM event.

`detail.waitUntil(promise)` delays processing until asynchronous work finishes. Cancel with `event.preventDefault()` or `detail.cancelled = true`.

### `htmx:sse:after:message`

Fires after htmx swaps or dispatches an SSE message.

```js
document.addEventListener('htmx:sse:after:message', event => {
  console.log('Received:', event.detail.message.data)
})
```

### `htmx:sse:close`

Fires when an SSE stream closes.

```js
document.addEventListener('htmx:sse:close', event => {
  console.log('Closed:', event.detail.reason)
})
```

`reason` is one of:

- `message`: `hx-sse:close` matched a named event
- `removed`: the source element left the DOM
- `ended`: the stream ended or exhausted its reconnect attempts
- `cancelled`: the initial stream was cancelled
- `cleanup`: htmx cleaned up the source element

### `htmx:sse:error`

Fires when reading or reconnecting to an SSE stream fails.

```js
document.addEventListener('htmx:sse:error', event => {
  console.error('SSE error:', event.detail.error)
})
```

- `connection`: the failed connection, when available
- `url`: the SSE URL when setup fails before a connection exists
- `error`: the error value
- `status`: the HTTP status for a failed reconnect response, when available

### `hx:release`

A server-sent event that ends the request lifecycle early. Only useful with [`sse.releaseOn:end`](#ssereleaseon).

```http
event: hx:release
data:

```

When the server sends this event, htmx hides indicators and re-enables elements immediately. The stream continues running in the background.

This is useful for LLM streaming where you want to:
- Show a loading indicator until the model starts responding
- Let the user interact with the page while tokens continue streaming

```html
<button hx-post="/generate"
        hx-target="#output"
        hx-swap="beforeend"
        hx-config="sse.releaseOn:end"
        hx-indicator="#spinner">
  Generate
</button>
```

The server streams:

```http
data: First token

event: hx:release
data:

data: more tokens...

```

The indicator hides after `hx:release`, but tokens keep appending.

## Config

### `sse.reconnect`

Control whether a closed stream reconnects automatically.

```html
<meta name="htmx-config" content="sse.reconnect:false">
```

Defaults to `true` for `hx-sse:connect` and `false` for normal htmx requests.

### `sse.reconnectDelay`

Set how long to wait before the first reconnect attempt.

```html
<meta name="htmx-config" content="sse.reconnectDelay:1s">
```

Defaults to `500` milliseconds. Each failed attempt doubles the delay, and values may be milliseconds or time strings such as `500ms`, `1s`, and `2m`.

The server can replace this value for the stream:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

retry: 2000
data: Reconnect after two seconds

```

### `sse.reconnectMaxDelay`

Limit how long to wait between reconnect attempts.

```html
<meta name="htmx-config" content="sse.reconnectMaxDelay:30s">
```

Defaults to `60000` milliseconds. Use milliseconds or a time string.

### `sse.reconnectMaxAttempts`

Limit how many times a closed stream tries to reconnect.

```html
<meta name="htmx-config" content="sse.reconnectMaxAttempts:5">
```

Defaults to `Infinity`.

### `sse.reconnectJitter`

Spread reconnect attempts so many clients do not retry at once.

```html
<meta name="htmx-config" content="sse.reconnectJitter:0">
```

Defaults to `0.3`, which randomizes each delay by up to ±30%. Use `0` for exact delays.

### `sse.pauseOnBackground`

Close the stream while the page is hidden and reconnect when it becomes visible.

```html
<meta name="htmx-config" content="sse.pauseOnBackground:false">
```

Defaults to `true` for `hx-sse:connect` and `false` for normal htmx requests. Use event IDs and server-side replay to recover messages sent while disconnected.

### `sse.releaseOn`

Control when the request lifecycle ends (indicators hide, elements re-enable).

```html
<meta name="htmx-config" content="sse.releaseOn:first">
```

Values:

- `immediate`: release when SSE takes over (after headers arrive)
- `first`: release after the first message swaps
- `end`: release when the stream closes

Defaults to `immediate` for `hx-sse:connect` and `end` for normal htmx requests.

With the default `end`, indicators stay visible and [`hx-disable`](/reference/attributes/hx-disable) keeps elements disabled until the stream closes. This works well for LLM streaming where you want to prevent duplicate submissions.

Use `first` if you want the UI to become interactive as soon as content starts arriving:

```html
<button hx-post="/generate"
        hx-config="sse.releaseOn:first">
  Generate
</button>
```

The server can also release early by sending an [`hx:release`](#hxrelease) event:

```http
event: hx:release
data:

```

## Migration

### htmx 2.0

htmx 2.0 used `EventSource` and selected named messages with `sse-swap`:

```html
<div sse-connect="/chat" sse-swap="message"></div>
```

htmx 4 uses a normal htmx request and swaps unnamed messages automatically:

```html
<div hx-sse:connect="/chat"></div>
```

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: <p>New message</p>

```

Named messages now dispatch DOM events instead of selecting a swap target:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

event: progress
data: 50

```

```html
<div hx-sse:connect="/progress"
     hx-on:progress="updateProgress(event.detail.data)">
</div>
```

Trigger another request with the ordinary event name:

```html
<!-- htmx 2 -->
<div hx-get="/status" hx-trigger="sse:progress"></div>

<!-- htmx 4 -->
<div hx-get="/status" hx-trigger="progress from:body"></div>
```

#### Attributes

These attributes changed:

| htmx 2.x | htmx 4.x | Compatibility |
|----------|----------|---------------|
| [`sse-connect`](https://htmx.org/extensions/sse/#connecting-to-an-sse-server) | [`hx-sse:connect`](#hx-sseconnect) | Works with a warning |
| [`sse-swap`](https://htmx.org/extensions/sse/#receiving-named-events) | Unnamed messages swap automatically | Removed; warns |
| [`sse-close`](https://htmx.org/extensions/sse/) | [`hx-sse:close`](#hx-sseclose) | Works with a warning |

#### Events

These events changed:

| htmx 2.x | htmx 4.x |
|----------|----------|
| [`htmx:sseOpen`](https://htmx.org/extensions/sse/#htmxsseopen) | [`htmx:sse:after:connection`](#htmxsseafterconnection) |
| [`htmx:sseError`](https://htmx.org/extensions/sse/#htmxsseerror) | [`htmx:sse:error`](#htmxsseerror) |
| [`htmx:sseBeforeMessage`](https://htmx.org/extensions/sse/#htmxssebeforemessage) | [`htmx:sse:before:message`](#htmxssebeforemessage) |
| [`htmx:sseMessage`](https://htmx.org/extensions/sse/#htmxssemessage) | [`htmx:sse:after:message`](#htmxsseaftermessage) |
| [`htmx:sseClose`](https://htmx.org/extensions/sse/#htmxsseclose) | [`htmx:sse:close`](#htmxsseclose) |

htmx 4 uses [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) and [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) instead of [`EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource). SSE responses can therefore use any htmx HTTP method, request values, and headers.

### Beta to RC1

RC1 namespaces SSE lifecycle events:

| Beta | RC1 |
|------|-----|
| `htmx:before:sse:connection` | [`htmx:sse:before:connection`](#htmxssebeforeconnection) |
| `htmx:after:sse:connection` | [`htmx:sse:after:connection`](#htmxsseafterconnection) |
| `htmx:before:sse:message` | [`htmx:sse:before:message`](#htmxssebeforemessage) |
| `htmx:after:sse:message` | [`htmx:sse:after:message`](#htmxsseaftermessage) |

Message cancellation moved from `detail.message.cancelled` to `detail.cancelled`. Before-message hooks can delay processing with `detail.waitUntil(promise)`.

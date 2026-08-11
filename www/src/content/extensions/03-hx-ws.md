---
title: "hx-ws"
description: "Stream HTML and send data over WebSockets"
category: "Networking"
icon: "icon-[mdi--connection]"
keywords: ["websockets", "ws", "real-time", "bidirectional", "socket"]
---

The `hx-ws` extension opens [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) connections, swaps incoming HTML, and sends form data as JSON.

If you used [`ws`](https://htmx.org/extensions/ws/) in htmx 2.0, see [migration notes](#migration).

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-ws.min.js"></script>
```

## Usage

### Update an Element

Open a [persistent](#wsreconnect) WebSocket connection:

```html
<div hx-ws:connect="/chat">
  ...
</div>
```

The browser receives this WebSocket message:

```html
<p>New message</p>
```

The result is:

```html
<div hx-ws:connect="/chat">
  <p>New message</p> <!-- Swapped in -->
</div>
```

htmx uses the same rules as with a `text/html` response:

- [`hx-target="this"`](/reference/attributes/hx-target#this)
- [`hx-swap="innerHTML"`](/reference/attributes/hx-swap#innerhtml) (from [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap))

**Choose the Swap**

Use [`hx-swap`](/reference/attributes/hx-swap) and [`hx-target`](/reference/attributes/hx-target) to choose how and where updates swap:

```html
<div hx-ws:connect="/chat"
     hx-target="#messages"
     hx-swap="beforeend">

  <div id="messages">
    <p>Old message</p>
    <!-- Content goes here -->
  </div>

</div>
```

The server sends:

```html
<p>New message</p>
```

The result is:

```html
<div hx-ws:connect="/chat"
     hx-target="#messages"
     hx-swap="beforeend">

  <div id="messages">
    <p>Old message</p>
    <p>New message</p> <!-- Appended -->
  </div>

</div>
```

You can also use:

- [`hx-select`](/reference/attributes/hx-select) to select content for the swap
- [`hx-select-oob`](/reference/attributes/hx-select-oob) to select more elements to swap

### Update Elements

Start with the page elements to update:

```html
<div hx-ws:connect="/chat"></div>

<div id="feed">
  <p>Old</p>
</div>
<div id="status">Offline</div>
```

We’ll send an [`hx-swap-oob`](/reference/attributes/hx-swap-oob) element and an [`<hx-partial>`](/reference/tags/hx-partial) (new in 4.0):

```html
<!-- Match by ID -->
<div id="status" hx-swap-oob="true">Online</div>

<!-- Append -->
<hx-partial hx-target="#feed" hx-swap="beforeend">
  <p>New</p>
</hx-partial>
```

The page becomes:

```html
<div hx-ws:connect="/chat"></div>

<div id="feed">
  <p>Old</p>
  <p>New</p>
</div>
<div id="status">Online</div>
```

<details>
<summary>Why wasn't the normal swap used?</summary>

After htmx extracts extra swaps, the normal swap may be empty:

```text
(empty)
```

[`hx-swap-oob`](/reference/attributes/hx-swap-oob) and [`<hx-partial>`](/reference/tags/hx-partial) elements are extracted before the normal swap. By default, [`swapEmpty:false`](/reference/attributes/hx-swap#swapempty) leaves the connection unchanged.

The server can also mix these updates with ordinary HTML:

```html
<p>New chat content</p>

<!-- Also replace #status -->
<hx-partial hx-target="#status">Busy</hx-partial>
```

The first element uses the connection's target and swap. The partial updates `#status`.

To disable the connection's swap, set `hx-swap="none"`:

```html
<div hx-ws:connect="/chat" hx-swap="none">
  ...
</div>
```

[`hx-swap-oob`](/reference/attributes/hx-swap-oob) and [`<hx-partial>`](/reference/tags/hx-partial) swaps still run.

</details>

### Send a Message

Add [`hx-ws:send`](#hx-wssend) to an input inside the connection:

```html
<div hx-ws:connect="/chat" hx-target="#messages">
  <div id="messages"></div>
  <input hx-ws:send type="button" name="message" value="Hello">
</div>
```

The outgoing message is:

```json
{
  "headers": {
    "HX-Request": "true",
    "HX-Request-Type": "partial",
    "HX-Source": "input",
    "HX-Target": "div#messages",
    "HX-Current-URL": "https://example.com/chat"
  },
  "message": "Hello"
}
```

`headers` is reserved for metadata. Form values and `hx-vals` use the other top-level keys.

Repeat a form field to send an array:

```html
<form hx-ws:send>
  <input name="tag" value="urgent">
  <input name="tag" value="public">
  <button>Send</button>
</form>
```

The outgoing message is:

```jsonc
{
  "headers": { /* ... */ },
  "tag": ["urgent", "public"]
}
```

[`hx-vals`](/reference/attributes/hx-vals) overrides form values without coercing its types:

```html
<form hx-ws:send hx-vals="count:2">
  <input name="count" value="1">
  <button>Send</button>
</form>
```

```jsonc
{ "headers": { /* ... */ }, "count": 2 }
```

### Override an Incoming Swap

Use JSON to override the connection's swap:

```json
{
  "content": "<p class=\"message\">New message</p>",
  "target": "#messages",
  "swap": "beforeend settle:10ms",
  "select": ".message"
}
```

- `content`: the HTML to swap
- `target`: where to swap it
- `swap`: a serialized [`hx-swap`](/reference/attributes/hx-swap) specification
- `select`: what to select from `content`

HTTP `HX-Re*` headers replace values already chosen for a request.

A WebSocket message may arrive without a request, so its JSON fields can choose those values from the start:

| JSON field | HTTP response header | Element default |
|------------|----------------------|-----------------|
| `target` | [`HX-Retarget`](/reference/headers/HX-Retarget) | [`hx-target`](/reference/attributes/hx-target) |
| `swap` | [`HX-Reswap`](/reference/headers/HX-Reswap) | [`hx-swap`](/reference/attributes/hx-swap) |
| `select` | [`HX-Reselect`](/reference/headers/HX-Reselect) | [`hx-select`](/reference/attributes/hx-select) |

`content` uses the same `hx-target`, `hx-swap`, and `hx-select` attributes as plain HTML. `hx-swap-oob` and `<hx-partial>` inside it still produce independent swaps.

The JSON fields override the corresponding attributes:

```text
TARGET
JSON target  -->  hx-target  -->  connection element

SWAP
JSON swap    -->  hx-swap    -->  defaultSwap

SELECT
JSON select  -->  hx-select  -->  all content
```

`hx-select-oob` remains an element setting. A server can use `hx-swap-oob` or `<hx-partial>` inside `content` instead.

### Handle Custom Messages

JSON without `content` is not swapped:

```json
{
  "type": "notification",
  "text": "New message"
}
```

Handle it with [`htmx:ws:before:message:incoming`](#htmxwsbeforemessageincoming):

```js
document.addEventListener('htmx:ws:before:message:incoming', async event => {
  let message = await event.detail.message.json()
  if (message.type === 'notification') showNotification(message)
})
```

Cancel the event to take over custom or binary processing:

```js
document.addEventListener('htmx:ws:before:message:incoming', async event => {
  event.preventDefault()
  handleCustomMessage(await event.detail.message.text())
})
```

`message.data` contains the original string, `Blob`, or `ArrayBuffer`.

Conversions are cached:

```js
await message.text()
await message.json()
await message.blob()
await message.arrayBuffer()
```

Cancel to skip built-in handling. Binary messages are not swapped automatically.

### Persistent Connections

WebSocket connections stay open for incoming and outgoing messages.

#### Open Connections

Use [`hx-trigger`](/reference/attributes/hx-trigger) to open a connection later than `load`:

```html
<button id="connect">Connect</button>

<div hx-ws:connect="/chat"
     hx-trigger="click from:#connect">
</div>
```

All [`hx-trigger` modifiers](/reference/attributes/hx-trigger#event-modifiers) are supported.

##### Open a Connection with `hx-ws:send`

Give `hx-ws:send` a URL to open a connection:

```html
<button hx-ws:send="/actions" name="action" value="refresh">
  Refresh
</button>
```

Clicking the button opens `/actions` and sends `action=refresh` over that connection.

##### Send During Reconnect

A user can trigger messages while a connection is reconnecting:

```html
<div hx-ws:connect="/actions">
  <button hx-ws:send name="action" value="save">Save</button>
  <button hx-ws:send name="action" value="refresh">Refresh</button>
</div>
```

If the user clicks **Save**, then **Refresh**, htmx sends both when the connection opens:

```jsonc
// First
{ "headers": { /* ... */ }, "action": "save" }

// Then
{ "headers": { /* ... */ }, "action": "refresh" }
```

##### Use Shared Connections

Put several [`hx-ws:send`](#hx-wssend) elements inside one [`hx-ws:connect`](#hx-wsconnect):

```html
<div hx-ws:connect="/actions">
  <button hx-ws:send name="action" value="save">Save</button>
  <button hx-ws:send name="action" value="delete">Delete</button>
</div>

<div id="save-result"></div>

<div id="delete-result"></div>
```

Both buttons use the same WebSocket connection. Incoming messages use a live element attached to that connection, not the button that sent the message.

**Route Incoming Messages**

Set `target` in an incoming JSON message to direct its swap:

```json
{
  "content": "<p>Saved</p>",
  "target": "#save-result"
}
```

Use `hx-swap-oob` or `<hx-partial>` when one message updates several targets.

**Reuse by URL**

Separate `hx-ws:connect` elements with the same URL share a connection too:

```html
<header hx-ws:connect="/actions"></header>
<main hx-ws:connect="/actions"></main>
```

Only one connection to `/actions` is opened. It closes when htmx removes its last element.

#### Close Connections

Close with code `1000` to stop reconnecting:

```js
socket.close(1000, 'done')
```

Codes in [`ws.reconnectCodes`](#wsreconnectcodes) reconnect instead.

#### Configure Connections

You can configure `hx-ws` in three places:

- **[`<meta name="htmx-config">`](/reference/config/htmx-config#configure-via-meta-tag)** sets global defaults from HTML.

  ```html
  <meta name="htmx-config"
        content="ws.reconnectDelay:1s ws.reconnectMaxAttempts:5">
  ```

- **[`htmx.config.ws`](#config)** sets global defaults from JavaScript.

  ```js
  htmx.config.ws.reconnectDelay = '1s'
  htmx.config.ws.reconnectMaxAttempts = 5
  ```

- **[`hx-config`](/reference/attributes/hx-config)** overrides the defaults for one connection.

  ```html
  <div hx-ws:connect="/ws"
       hx-config="ws.reconnectMaxAttempts:2">
  </div>
  ```

These values are read when the connection is created.

## Attributes

### `hx-ws:connect`

Opens a WebSocket connection:

```html
<div hx-ws:connect="/chat"></div>
```

Incoming HTML uses these inherited swap attributes:

- [`hx-target`](/reference/attributes/hx-target): defaults to the connection element
- [`hx-swap`](/reference/attributes/hx-swap): defaults to [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap)
- [`hx-select`](/reference/attributes/hx-select): selects content for the connection's swap
- [`hx-select-oob`](/reference/attributes/hx-select-oob): selects more elements to swap

Defaults:

- [`swapEmpty:false`](/reference/attributes/hx-swap#swapempty); set it explicitly in `hx-swap` to override it
- [`hx-trigger="load"`](/reference/attributes/hx-trigger#load); use [`hx-trigger`](#open-connections) to change it
- [`ws.reconnect:true`](#wsreconnect)
- [`ws.pauseOnBackground:true`](#wspauseonbackground)

[Elements using the same URL share one connection](#use-shared-connections).

### `hx-ws:send`

Sends form data and [`hx-vals`](/reference/attributes/hx-vals) as JSON.

```html
<div hx-ws:connect="/chat">
  <form id="chat-form" hx-ws:send hx-target="#messages">
    <input name="message">
    <button>Send</button>
  </form>
  <div id="messages"></div>
</div>
```

- `hx-ws:send`: use the nearest ancestor connection
- `hx-ws:send="<url>"`: open a direct connection

Default [`hx-trigger`](/reference/attributes/hx-trigger):

- `change` for text inputs, `<textarea>`, and `<select>`
- `submit` for `<form>`
- `click` for buttons and other elements

## Events

Event data is available on `event.detail`.

Connection and close events:

```js
event.detail.connection = {
  url,
  config,
  socket,     // WebSocket or null
  queue,      // outgoing messages waiting to send
  attempt,    // reconnect count
  cancelled
}
```

Incoming message events:

```js
event.detail = {
  message: {
    data,          // original string, Blob, or ArrayBuffer
    type,          // "text" or "binary"
    text(),
    json(),
    blob(),
    arrayBuffer()
  },
  waitUntil(),     // before processing only
  cancelled        // before processing only
}
```

Outgoing message events expose:

```js
event.detail = {
  message: {
    headers,       // htmx metadata
    values,        // form values and hx-vals
    data            // replacement payload before send; sent payload afterward
  },
  waitUntil(),     // before sending only
  cancelled        // before sending only
}
```

Message events dispatch from a live element attached to the connection.

### `htmx:ws:before:connection`

Fires before the initial connection and each reconnect.

```js
document.addEventListener('htmx:ws:before:connection', event => {
  event.detail.connection.config.protocols = 'graphql-transport-ws'
})
```

Cancel either way:

- call `event.preventDefault()`
- set `event.detail.connection.cancelled` to `true`

### `htmx:ws:after:connection`

Fires after a connection opens.

```js
document.addEventListener('htmx:ws:after:connection', event => {
  event.detail.connection.socket.binaryType = 'arraybuffer'
})
```

### `htmx:ws:before:message:outgoing`

Fires before sending an outgoing message.

```js
document.addEventListener('htmx:ws:before:message:outgoing', event => {
  let message = event.detail.message
  message.headers.Authorization = `Bearer ${token}`

  if (!isValid(message.values)) event.preventDefault()
})
```

- `message.headers`: mutable htmx metadata
- `message.values`: mutable form values and `hx-vals`
- `message.data`: optional replacement payload

`detail.waitUntil(promise)` delays serialization and sending until asynchronous work finishes.

The normal path serializes `{...values, headers}` as JSON. Set `message.data` to send a string, `Blob`, `ArrayBuffer`, or typed-array view instead:

```js
document.addEventListener('htmx:ws:before:message:outgoing', event => {
  let message = event.detail.message
  message.data = encodeMessagePack({
    ...message.values,
    headers: message.headers
  })
})
```

Include `message.headers` in replacement data when the server needs htmx request metadata.

### `htmx:ws:after:message:outgoing`

Fires after sending an outgoing message.

```js
document.addEventListener('htmx:ws:after:message:outgoing', event => {
  console.log('Outgoing:', event.detail.message.data)
})
```

`message.data` is the value passed to `WebSocket.send()`.

### `htmx:ws:before:message:incoming`

Fires before processing an incoming message.

```js
document.addEventListener('htmx:ws:before:message:incoming', event => {
  let { message, waitUntil } = event.detail

  waitUntil(message.json().then(data => {
    if (!isValid(data)) event.detail.cancelled = true
  }))
})
```

`detail.waitUntil(promise)` delays built-in processing until asynchronous work finishes.

Cancel synchronous processing either way:

- call `event.preventDefault()`
- set `event.detail.cancelled` to `true`

### `htmx:ws:after:message:incoming`

Fires after the extension handles an incoming message.

```js
document.addEventListener('htmx:ws:after:message:incoming', event => {
  console.log('Incoming:', event.detail.message.data)
})
```

### `htmx:ws:close`

Fires when a connection closes.

```js
document.addEventListener('htmx:ws:close', event => {
  console.log('Closed:', event.detail.reason, event.detail.code)
})
```

- `reason`: `closed`, `removed`, or `cancelled`
- `code`: the WebSocket close code, or `null`

A code in [`ws.reconnectCodes`](#wsreconnectcodes) schedules a reconnect when [`ws.reconnect:true`](#wsreconnect).

### `htmx:ws:error`

Fires on connection and send errors.

```js
document.addEventListener('htmx:ws:error', event => {
  console.error('WebSocket error:', event.detail.error)
})
```

- `url`: the WebSocket URL, or `null`
- `error`: the error value

## Config

### `ws.reconnect`

Control whether allowed close codes reconnect automatically.

```html
<meta name="htmx-config" content="ws.reconnect:false">
```

Defaults to `true`.

### `ws.reconnectCodes`

Choose which WebSocket close codes reconnect:

```html
<meta name="htmx-config"
      content='{"ws":{"reconnectCodes":[1001,1005,1006,1011,1012,1013,1014]}}'>
```

Defaults to:

- `1001`: Going Away
- `1005`: No Status Received
- `1006`: Abnormal Closure
- `1011`: Internal Error
- `1012`: Service Restart
- `1013`: Try Again Later
- `1014`: Bad Gateway

See [MDN's close code descriptions](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code#value) and the [IANA close code registry](https://www.iana.org/assignments/websocket/websocket.xml#close-code-number).

### `ws.reconnectDelay`

Set how long to wait before the first reconnect attempt.

```html
<meta name="htmx-config" content="ws.reconnectDelay:1s">
```

Defaults to `500` milliseconds. Each failed attempt doubles the delay, and values may be milliseconds or time strings such as `500ms`, `1s`, and `2m`.

### `ws.reconnectMaxDelay`

Limit how long to wait between reconnect attempts.

```html
<meta name="htmx-config" content="ws.reconnectMaxDelay:30s">
```

Defaults to `60000` milliseconds. Use milliseconds or a time string.

### `ws.reconnectMaxAttempts`

Limit how many times a closed connection tries to reconnect.

```html
<meta name="htmx-config" content="ws.reconnectMaxAttempts:5">
```

Defaults to `Infinity`.

### `ws.reconnectJitter`

Spread reconnect attempts so many clients do not retry at once.

```html
<meta name="htmx-config" content="ws.reconnectJitter:0">
```

Defaults to `0.3`, which randomizes each delay by up to ±30%. Use `0` for exact delays.

### `ws.maxOutgoingMessagesQueueSize`

Limit how many [outgoing messages can wait during reconnect](#send-during-reconnect).

```html
<meta name="htmx-config" content="ws.maxOutgoingMessagesQueueSize:20">
```

Defaults to `100`. Further messages fire `htmx:ws:error` and are not sent. Use `0` to disable queuing.

### `ws.pauseOnBackground`

Close connections while the page is hidden and reconnect when it becomes visible.

```html
<meta name="htmx-config" content="ws.pauseOnBackground:false">
```

Defaults to `true`.

### `ws.protocols`

Set [WebSocket subprotocols](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#protocols) for the handshake.

```html
<meta name="htmx-config" content="ws.protocols:graphql-transport-ws">
```

No subprotocol is set by default. Use JSON config to set several subprotocols.

## Migration

### htmx 2.0

htmx 2.0 treats every incoming element as an implicit [`hx-swap-oob`](https://htmx.org/extensions/ws/#receiving-messages-from-a-websocket):

```html
<!-- interpreted as hx-swap-oob="true" by default -->
<div id="notifications">
  New message
</div>
```

htmx 4.0 uses [`hx-target`](/reference/attributes/hx-target) and [`hx-swap`](/reference/attributes/hx-swap) on the connection:

```html
<div hx-ws:connect="/notifications"
     hx-target="#notifications"
     hx-swap="outerHTML">
</div>

<div id="notifications"></div>
```

The incoming message contains plain HTML:

```html
<div id="notifications">
  New message
</div>
```

htmx 4.0 requires explicit syntax for each extra swap:

- [`hx-swap-oob`](/reference/attributes/hx-swap-oob) or [`<hx-partial>`](/reference/tags/hx-partial) for extra swaps
- [JSON](#override-an-incoming-swap) to choose the connection's target and swap

#### Outgoing Messages

htmx 2 added `HEADERS` to the form values:

```json
{
  "message": "Hello",
  "HEADERS": {
    "HX-Request": "true"
  }
}
```

htmx 4 reserves `headers` for metadata and puts values at the top level:

```json
{
  "headers": {
    "HX-Request": "true"
  },
  "message": "Hello"
}
```

#### Attributes and APIs

These names changed:

| htmx 2.x | htmx 4.x |
|----------|----------|
| [`ws-connect`](https://htmx.org/extensions/ws/#usage) | [`hx-ws:connect`](#hx-wsconnect) |
| [`ws-send`](https://htmx.org/extensions/ws/#usage) | [`hx-ws:send`](#hx-wssend) |
| [`htmx.config.wsReconnectDelay`](https://htmx.org/extensions/ws/#configuration) | [`htmx.config.ws.reconnectDelay`](#wsreconnectdelay) |
| [`createWebSocket`](https://htmx.org/extensions/ws/#configuration) | Removed |
| [`wsBinaryType`](https://htmx.org/extensions/ws/#configuration) | Removed |
| [`socketWrapper`](https://htmx.org/extensions/ws/#socket-wrapper) | Removed |

`ws-connect` and `ws-send` still work with a warning.

#### Events

These events changed:

| htmx 2.x | htmx 4.x |
|----------|----------|
| [`htmx:wsConnecting`](https://htmx.org/extensions/ws/#htmx:wsConnecting) | Removed |
| [`htmx:wsOpen`](https://htmx.org/extensions/ws/#htmx:wsOpen) | [`htmx:ws:after:connection`](#htmxwsafterconnection) |
| [`htmx:wsClose`](https://htmx.org/extensions/ws/#htmx:wsClose) | [`htmx:ws:close`](#htmxwsclose) |
| [`htmx:wsError`](https://htmx.org/extensions/ws/#htmx:wsError) | [`htmx:ws:error`](#htmxwserror) |
| [`htmx:wsBeforeMessage`](https://htmx.org/extensions/ws/#htmx:wsBeforeMessage) | [`htmx:ws:before:message:incoming`](#htmxwsbeforemessageincoming) |
| [`htmx:wsAfterMessage`](https://htmx.org/extensions/ws/#htmx:wsAfterMessage) | [`htmx:ws:after:message:incoming`](#htmxwsaftermessageincoming) |
| [`htmx:wsConfigSend`](https://htmx.org/extensions/ws/#htmx:wsConfigSend) | [`htmx:ws:before:message:outgoing`](#htmxwsbeforemessageoutgoing) |
| [`htmx:wsBeforeSend`](https://htmx.org/extensions/ws/#htmx:wsBeforeSend) | [`htmx:ws:before:message:outgoing`](#htmxwsbeforemessageoutgoing) |
| [`htmx:wsAfterSend`](https://htmx.org/extensions/ws/#htmx:wsAfterSend) | [`htmx:ws:after:message:outgoing`](#htmxwsaftermessageoutgoing) |

### Beta to RC1

RC1 changes the beta message formats, events, and reconnect behavior.

#### Outgoing Messages

The wire format changed from `{headers, body: values}` to `{...values, headers}`. `headers` is reserved, so a form field or `hx-vals` entry with that name is not sent.

Event detail changed from `{headers, body}` to `{message: {headers, values, data}, waitUntil, cancelled}`. Set `message.data` to replace the payload. Use `waitUntil(promise)` to finish asynchronous work before serialization, queueing, or sending.

#### Incoming Messages

Top-level `HX-Request-ID` and `request_id` no longer affect incoming messages.

Event detail changed from `{message: {text, json, cancelled}}` to `{message: {data, type, text(), json(), blob(), arrayBuffer()}, waitUntil, cancelled}`. The conversion fields are now methods. Cancel with `event.preventDefault()` or `event.detail.cancelled = true`.

#### Events

| Beta | RC1 |
|------|-----|
| `htmx:before:ws:connection` | [`htmx:ws:before:connection`](#htmxwsbeforeconnection) |
| `htmx:after:ws:connection` | [`htmx:ws:after:connection`](#htmxwsafterconnection) |
| `htmx:before:ws:request` | [`htmx:ws:before:message:outgoing`](#htmxwsbeforemessageoutgoing) |
| `htmx:after:ws:request` | [`htmx:ws:after:message:outgoing`](#htmxwsaftermessageoutgoing) |
| `htmx:before:ws:message` | [`htmx:ws:before:message:incoming`](#htmxwsbeforemessageincoming) |
| `htmx:after:ws:message` | [`htmx:ws:after:message:incoming`](#htmxwsaftermessageincoming) |

#### Reconnection

The beta reconnected after every close. RC1 reconnects only when [`ws.reconnect`](#wsreconnect) is `true`, the close code is in [`ws.reconnectCodes`](#wsreconnectcodes), and a connected element remains.

Code `1000` stops reconnecting by default. Messages created while a connection opens or reconnects are queued and sent in order.

#### Other Changes

| Beta | RC1 | Compatibility |
|------|-----|---------------|
| `htmx.config.websockets` | [`htmx.config.ws`](#config) | Removed |
| `ws.pendingRequestTTL` | Removed | Removed |
| `ws.reconnectJitter:true/false` | [`ws.reconnectJitter:0.3/0`](#wsreconnectjitter) | Removed |
| `payload` | [`content`](#override-an-incoming-swap) | Works with a warning |

## Notes

- [`hx-ws:connect`](#hx-wsconnect) accepts:
  - Root-relative URLs: `/ws`
  - Path-relative URLs: `events`
  - Protocol-relative URLs: `//api.example.com/ws`
  - HTTP(S) URLs: `https://example.com/ws`
  - WebSocket URLs: `wss://example.com/ws`

  HTTP(S) URLs are converted to their WebSocket equivalents.

- Each connection processes incoming and outgoing messages in order. Incoming processing waits for each swap to finish.
- All WebSocket swaps use [`htmx.swap()`](/reference/methods/htmx-swap).
- Use `hx-ws-connect` and `hx-ws-send` when colons are not supported, such as in JSX.

## See Also

- [`hx-swap`](/reference/attributes/hx-swap)
- [`hx-target`](/reference/attributes/hx-target)
- [`hx-select`](/reference/attributes/hx-select)
- [`hx-select-oob`](/reference/attributes/hx-select-oob)
- [`hx-trigger`](/reference/attributes/hx-trigger)
- [`htmx.swap()`](/reference/methods/htmx-swap)
- [`hx-sse`](/extensions/hx-sse)

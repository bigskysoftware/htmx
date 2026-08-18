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
<div hx-ws:connect="/chat" hx-target="this">
  ...
</div>
```

The browser receives this WebSocket message:

```html
<p>New message</p>
```

The result is:

```html
<div hx-ws:connect="/chat" hx-target="this">
  <p>New message</p> <!-- Swapped in -->
</div>
```

The explicit target enables the normal swap. htmx uses:

- [`hx-target="this"`](/reference/attributes/hx-target#this)
- [`hx-swap="innerHTML"`](/reference/attributes/hx-swap#innerhtml) (from [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap))

Without an element or JSON target, plain incoming HTML uses `swap:none`. Explicit [`hx-swap-oob`](/reference/attributes/hx-swap-oob) and [`<hx-partial>`](/reference/tags/hx-partial) swaps still run.

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

### Update Elements

Use explicit extra swaps to update several elements:

```html
<div hx-ws:connect="/chat" hx-swap="none"></div>

<div id="feed">
  <p>Old</p>
</div>
<div id="status">Offline</div>
```

The server sends an [`hx-swap-oob`](/reference/attributes/hx-swap-oob) element and an [`<hx-partial>`](/reference/tags/hx-partial):

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
<div hx-ws:connect="/chat" hx-swap="none"></div>

<div id="feed">
  <p>Old</p>
  <p>New</p>
</div>
<div id="status">Online</div>
```

`hx-swap="none"` disables the connection element's normal swap. The explicit extra swaps still run.

### Send a Message

Add [`hx-ws:send`](#hx-wssend) to a form inside the connection:

```html
<div hx-ws:connect="/chat" hx-target="#messages">
  <div id="messages"></div>

  <form hx-ws:send>
    <input name="message" value="Hello">
    <button>Send</button>
  </form>
</div>
```

The outgoing message is:

```json
{
  "headers": {
    "HX-Request": "true",
    "HX-Request-ID": "550e8400-e29b-41d4-a716-446655440000",
    "HX-Request-Type": "partial",
    "HX-Source": "form",
    "HX-Target": "div#messages",
    "HX-Current-URL": "https://example.com/chat"
  },
  "body": {
    "message": "Hello"
  }
}
```

`headers` contains htmx metadata. `body` contains form values and [`hx-vals`](/reference/attributes/hx-vals).

Repeat a form field to send an array:

```html
<form hx-ws:send>
  <input name="tag" value="urgent">
  <input name="tag" value="public">
  <button>Send</button>
</form>
```

```jsonc
{
  "headers": { /* ... */ },
  "body": {
    "tag": ["urgent", "public"]
  }
}
```

`hx-vals` overrides form values without coercing its types:

```html
<form hx-ws:send hx-vals="count:2">
  <input name="count" value="1">
  <button>Send</button>
</form>
```

```jsonc
{ "headers": { /* ... */ }, "body": { "count": 2 } }
```

### Override an Incoming Swap

Use JSON to override the connection's swap:

```json
{
  "content": "<p class=\"message\">New message</p>",
  "target": "#messages",
  "swap": "beforeend settle:10ms"
}
```

- `content`: the HTML to swap
- `target`: where to swap it
- `swap`: a serialized [`hx-swap`](/reference/attributes/hx-swap) specification
- `HX-Request-ID`: an optional top-level sender correlation ID
- `request_id`: a supported legacy correlation ID

The JSON fields override the corresponding attributes:

```text
TARGET
JSON target  -->  hx-target  -->  connection element

SWAP
JSON swap    -->  hx-swap    -->  defaultSwap when a target is set
```

`hx-swap-oob` and `<hx-partial>` inside `content` still produce independent swaps.

### Handle Custom Messages

JSON without `content` is not swapped:

```json
{
  "type": "notification",
  "text": "New message"
}
```

Handle it with [`htmx:before:ws:message`](#htmxbeforewsmessage):

```js
document.addEventListener('htmx:before:ws:message', event => {
  let message = event.detail.message.json
  if (message?.type === 'notification') showNotification(message)
})
```

The event exposes:

- `message.text`: the original text
- `message.json`: the parsed object, or `null`
- `message.cancelled`: set to `true` to skip built-in handling

You can also call `event.preventDefault()` to take over processing.

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
<button hx-ws:send="/actions" hx-vals="action:refresh">
  Refresh
</button>
```

Clicking the button opens `/actions` and sends the values over that connection.

##### Use Shared Connections

Put several [`hx-ws:send`](#hx-wssend) elements inside one [`hx-ws:connect`](#hx-wsconnect):

```html
<div hx-ws:connect="/actions">
  <button hx-ws:send hx-vals="action:save"
          hx-target="#save-result">Save</button>
  <button hx-ws:send hx-vals="action:delete"
          hx-target="#delete-result">Delete</button>
</div>

<div id="save-result"></div>
<div id="delete-result"></div>
```

Both buttons use the same WebSocket connection. Copy an outgoing [`HX-Request-ID`](#hx-request-id) into the top level of its incoming message to use the sending button's target:

```json
{
  "HX-Request-ID": "550e8400-e29b-41d4-a716-446655440000",
  "content": "<p>Saved</p>"
}
```

Without the ID, a live connection element handles the message.

Separate `hx-ws:connect` elements with the same URL also share one connection:

```html
<header hx-ws:connect="/actions"></header>
<main hx-ws:connect="/actions"></main>
```

The connection closes when htmx removes its last element.

#### Close Connections

By default, a WebSocket close schedules a reconnect. Set [`ws.reconnect:false`](#wsreconnect) when the connection should remain closed:

```html
<div hx-ws:connect="/one-shot" hx-config="ws.reconnect:false"></div>
```

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
<div hx-ws:connect="/chat" hx-target="#messages"></div>
```

Incoming HTML uses:

- [`hx-target`](/reference/attributes/hx-target): enables the normal swap and chooses its target
- [`hx-swap`](/reference/attributes/hx-swap): defaults to [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap) when a target is set

Without an element or JSON target, ordinary incoming HTML uses `swap:none`. Explicit `hx-swap-oob` and `<hx-partial>` swaps still run.

Other defaults:

- [`hx-trigger="load"`](/reference/attributes/hx-trigger#load)
- [`ws.reconnect:true`](#wsreconnect)
- [`ws.pauseOnBackground:true`](#wspauseonbackground)

Elements using the same normalized URL share one connection.

### `hx-ws:send`

Sends form data and [`hx-vals`](/reference/attributes/hx-vals) as `{headers, body}` JSON.

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

- `change` for inputs other than button and submit inputs, plus `<textarea>` and `<select>`
- `submit` for `<form>`
- `click` for button and submit inputs, plus other elements

## Headers

### `HX-Request-ID`

Associates an incoming message with its outgoing sender.

```jsonc
// Browser to server
{
  "headers": { "HX-Request-ID": "abc123" },
  "body": { "action": "save" }
}

// Server to browser
{
  "HX-Request-ID": "abc123",
  "content": "<p>Saved</p>"
}
```

`hx-ws` adds a unique ID to every outgoing message. Copy it from the outgoing `headers` object to the incoming message's top level to use the sender's target and swap attributes.

## Events

Event data is available on `event.detail`.

### `htmx:before:ws:connection`

Fires before the initial connection and each reconnect.

```js
document.addEventListener('htmx:before:ws:connection', event => {
  event.detail.connection.config.protocols = 'graphql-transport-ws'
})
```

Cancel either way:

- call `event.preventDefault()`
- set `event.detail.connection.cancelled` to `true`

### `htmx:after:ws:connection`

Fires after a connection opens.

```js
document.addEventListener('htmx:after:ws:connection', event => {
  console.log('Connected:', event.detail.connection.url)
})
```

Connection events expose the internal connection state, including `url`, `config`, `socket`, `attempt`, `cancelled`, and `pendingRequests`.

### `htmx:before:ws:request`

Fires before sending an outgoing message.

```js
document.addEventListener('htmx:before:ws:request', event => {
  event.detail.headers.Authorization = `Bearer ${token}`
  if (!isValid(event.detail.body)) event.preventDefault()
})
```

`detail.headers` and `detail.body` are mutable.

### `htmx:after:ws:request`

Fires after sending an outgoing message.

```js
document.addEventListener('htmx:after:ws:request', event => {
  console.log('Outgoing:', event.detail.body)
})
```

### `htmx:before:ws:message`

Fires before processing an incoming text message.

```js
document.addEventListener('htmx:before:ws:message', event => {
  let message = event.detail.message
  if (message.json?.type === 'heartbeat') event.preventDefault()
})
```

Cancel either way:

- call `event.preventDefault()`
- set `event.detail.message.cancelled` to `true`

### `htmx:after:ws:message`

Fires after the extension handles an incoming message.

```js
document.addEventListener('htmx:after:ws:message', event => {
  console.log('Incoming:', event.detail.message.text)
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

When `ws.reconnect` is true, any WebSocket close code schedules a reconnect while a connected element remains. Background pausing waits until the page becomes visible.

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

Control whether a closed connection reconnects automatically.

```html
<meta name="htmx-config" content="ws.reconnect:false">
```

Defaults to `true`.

### `ws.reconnectDelay`

Set how long to wait before the first reconnect attempt.

```html
<meta name="htmx-config" content="ws.reconnectDelay:1s">
```

Defaults to `500` milliseconds. Each failed attempt doubles the delay. Values may be milliseconds or time strings such as `500ms`, `1s`, and `2m`.

### `ws.reconnectMaxDelay`

Limit how long to wait between reconnect attempts.

```html
<meta name="htmx-config" content="ws.reconnectMaxDelay:30s">
```

Defaults to `60000` milliseconds.

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

Defaults to `0.3`, which randomizes each delay by up to 30%. Use `0` or `false` for exact delays. `true` uses the default `0.3` factor.

### `ws.pauseOnBackground`

Close connections while the page is hidden and reconnect when it becomes visible.

```html
<meta name="htmx-config" content="ws.pauseOnBackground:false">
```

Defaults to `true`.

### `ws.pendingRequestTTL`

Set how long `hx-ws` remembers an outgoing message so an incoming message can use its sender.

```html
<meta name="htmx-config" content="ws.pendingRequestTTL:60000">
```

Defaults to `30000` milliseconds. After it expires, the incoming message uses a live connection element.

### `ws.protocols`

Set [WebSocket subprotocols](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/WebSocket#protocols) for the handshake.

```html
<meta name="htmx-config" content="ws.protocols:graphql-transport-ws">
```

No subprotocol is set by default. Use JSON config to set several subprotocols.

## Migration

### htmx 2.0

htmx 2.0 treats every incoming element as an implicit [`hx-swap-oob`](https://htmx.org/extensions/ws/#receiving-messages-from-a-websocket). htmx 4 uses `hx-target` and `hx-swap` on the connection, or explicit `hx-swap-oob` and `<hx-partial>` elements.

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

htmx 4 separates metadata and values:

```json
{
  "headers": {
    "HX-Request": "true"
  },
  "body": {
    "message": "Hello"
  }
}
```

#### Attributes and APIs

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

| htmx 2.x | htmx 4.x |
|----------|----------|
| [`htmx:wsConnecting`](https://htmx.org/extensions/ws/#htmx:wsConnecting) | Removed |
| [`htmx:wsOpen`](https://htmx.org/extensions/ws/#htmx:wsOpen) | [`htmx:after:ws:connection`](#htmxafterwsconnection) |
| [`htmx:wsClose`](https://htmx.org/extensions/ws/#htmx:wsClose) | [`htmx:ws:close`](#htmxwsclose) |
| [`htmx:wsError`](https://htmx.org/extensions/ws/#htmx:wsError) | [`htmx:ws:error`](#htmxwserror) |
| [`htmx:wsBeforeMessage`](https://htmx.org/extensions/ws/#htmx:wsBeforeMessage) | [`htmx:before:ws:message`](#htmxbeforewsmessage) |
| [`htmx:wsAfterMessage`](https://htmx.org/extensions/ws/#htmx:wsAfterMessage) | [`htmx:after:ws:message`](#htmxafterwsmessage) |
| [`htmx:wsConfigSend`](https://htmx.org/extensions/ws/#htmx:wsConfigSend) | [`htmx:before:ws:request`](#htmxbeforewsrequest) |
| [`htmx:wsBeforeSend`](https://htmx.org/extensions/ws/#htmx:wsBeforeSend) | [`htmx:before:ws:request`](#htmxbeforewsrequest) |
| [`htmx:wsAfterSend`](https://htmx.org/extensions/ws/#htmx:wsAfterSend) | [`htmx:after:ws:request`](#htmxafterwsrequest) |

### htmx 4.0 Alpha

Early htmx 4 builds used different names:

| Early htmx 4 | Current | Compatibility |
|--------------|---------|---------------|
| `htmx.config.websockets` | [`htmx.config.ws`](#config) | Removed |
| `payload` | [`content`](#override-an-incoming-swap) | Works with a warning |
| incoming `request_id` | incoming `HX-Request-ID` | Still supported |

Boolean `ws.reconnectJitter` values remain supported. `true` means `0.3`; `false` means `0`.

## Notes

- [`hx-ws:connect`](#hx-wsconnect) accepts root-relative, path-relative, protocol-relative, HTTP(S), and WebSocket URLs. HTTP(S) URLs are converted to WebSocket URLs.
- A send triggered while the initial socket opens waits for that socket. A send triggered while reconnecting reports `Connection not open`.
- All WebSocket swaps use [`htmx.swap()`](/reference/methods/htmx-swap).
- Use `hx-ws-connect` and `hx-ws-send` when colons are not supported, such as in JSX.

## See Also

- [`hx-swap`](/reference/attributes/hx-swap)
- [`hx-target`](/reference/attributes/hx-target)
- [`hx-trigger`](/reference/attributes/hx-trigger)
- [`htmx.swap()`](/reference/methods/htmx-swap)
- [`hx-sse`](/extensions/hx-sse)

+++
title = "websockets"
+++

The `WebSockets` extension enables easy, bi-directional communication
with [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
servers directly from HTML. This replaces the experimental `hx-ws` attribute built into previous versions of htmx. For
help migrating from older versions, see the [Migrating](#migrating-from-previous-versions) guide at the bottom of this page.

Use the following attributes to configure how WebSockets behave:

* `ws-connect="<url>"` or `ws-connect="<prefix>:<url>"` - A URL to establish an `WebSocket` connection against.
* Prefixes `ws` or `wss` can optionally be specified. If not specified, HTMX defaults to add the location's scheme-type,
  host and port to have browsers send cookies via websockets.
* `ws-send` - Sends a message to the nearest websocket based on the trigger value for the element (either the natural
  event
  or the event specified by [`hx-trigger`])

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js"></script>
```

## Usage

```html

<div hx-ext="ws" ws-connect="/chatroom">
    <div id="notifications"></div>
    <div id="chat_room">
        ...
    </div>
    <form id="form" ws-send>
        <input name="chat_message">
    </form>
</div>
```

### Configuration

WebSockets extension support two configuration options:

- `createWebSocket` - a factory function that can be used to create a custom WebSocket instances. Must be a function,
  returning `WebSocket` object
- `wsBinaryType` - a string value, that defines
  socket's [`binaryType`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/binaryType) property. Default value
  is `blob`

### Receiving Messages from a WebSocket

The example above establishes a WebSocket to the `/chatroom` end point. Content that is sent down from the websocket
will
be parsed as HTML and swapped in by the `id` property, using the same logic
as [Out of Band Swaps](@/attributes/hx-swap-oob.md).

As such, if you want to change the swapping method (e.g., append content at the end of an element or delegate swapping
to an extension),
you need to specify that in the message body, sent by the server.

```html
<!-- will be interpreted as hx-swap-oob="true" by default -->
<form id="form">
    ...
</form>
<!-- will be appended to #notifications div -->
<div id="notifications" hx-swap-oob="beforeend">
    New message received
</div>
<!-- will be swapped using an extension -->
<div id="chat_room" hx-swap-oob="morphdom">
    ....
</div>
```

### Sending Messages to a WebSocket

In the example above, the form uses the `ws-send` attribute to indicate that when it is submitted, the form values
should be **serialized as JSON**
and send to the nearest enclosing `WebSocket`, in this case the `/chatroom` endpoint.

The serialized values will include a field, `HEADERS`, that includes the headers normally submitted with an htmx
request.

### Automatic Reconnection

If the WebSocket is closed unexpectedly, due to `Abnormal Closure`, `Service Restart` or `Try Again Later`, this
extension will attempt to reconnect until the connection is reestablished.

By default, the extension uses a
full-jitter [exponential-backoff algorithm](https://en.wikipedia.org/wiki/Exponential_backoff) that chooses a randomized
retry delay that grows exponentially over time. You can use a different algorithm by writing it
into `htmx.config.wsReconnectDelay`. This function takes a single parameter, the number of retries, and returns the
time (in milliseconds) to wait before trying again.

```javascript
// example reconnect delay that you shouldn't use because
// it's not as good as the algorithm that's already in place
htmx.config.wsReconnectDelay = function (retryCount) {
    return retryCount * 1000 // return value in milliseconds
}
```

The extension also implements a simple queuing mechanism that keeps messages in memory when the socket is not in `OPEN`
state and sends them once the connection is restored.

### Events

WebSockets extensions exposes a set of events that allow you to observe and customize its behavior.

#### Event - `htmx:wsConnecting` {#htmx:wsConnecting}

This event is triggered when a connection to a WebSocket endpoint is being attempted.

##### Details

* `detail.event.type` - the type of the event (`'connecting'`)

#### Event - `htmx:wsOpen` {#htmx:wsOpen}

This event is triggered when a connection to a WebSocket endpoint has been established.

##### Details

* `detail.elt` - the element that holds the socket (the one with `ws-connect` attribute)
* `detail.event` - the original event from the socket
* `detail.socketWrapper` - the wrapper around socket object

#### Event - `htmx:wsClose` {#htmx:wsClose}

This event is triggered when a connection to a WebSocket endpoint has been closed normally.
You can check if the event was caused by an error by inspecting `detail.event` property.

##### Details

* `detail.elt` - the element that holds the socket (the one with `ws-connect` attribute)
* `detail.event` - the original event from the socket
* `detail.socketWrapper` - the wrapper around socket object

#### Event - `htmx:wsError` {#htmx:wsError}

This event is triggered when `onerror` event on a socket is raised.

##### Details

* `detail.elt` - the element that holds the socket (the one with `ws-connect` attribute)
* `detail.error` - the error object
* `detail.socketWrapper` - the wrapper around socket object

#### Event - `htmx:wsBeforeMessage` {#htmx:wsBeforeMessage}

This event is triggered when a message has just been received by a socket, similar to `htmx:beforeOnLoad`. This event
fires
before any processing occurs.

If the event is cancelled, no further processing will occur.

* `detail.elt` - the element that holds the socket (the one with `ws-connect` attribute)
* `detail.message` - raw message content
* `detail.socketWrapper` - the wrapper around socket object

#### Event - `htmx:wsAfterMessage` {#htmx:wsAfterMessage}

This event is triggered when a message has been completely processed by htmx and all changes have been
settled, similar to `htmx:afterOnLoad`.

Cancelling this event has no effect.

* `detail.elt` - the element that holds the socket (the one with `ws-connect` attribute)
* `detail.message` - raw message content
* `detail.socketWrapper` - the wrapper around socket object

#### Event - `htmx:wsConfigSend` {#htmx:wsConfigSend}

This event is triggered when preparing to send a message from `ws-send` element.
Similarly to [`htmx:configRequest`](@/events.md#htmx:configRequest), it allows you to modify the message
before sending.

If the event is cancelled, no further processing will occur and no messages will be sent.

##### Details

* `detail.parameters` - the parameters that will be submitted in the request
* `detail.unfilteredParameters` - the parameters that were found before filtering
  by [`hx-select`](@/attributes/hx-select.md)
* `detail.headers` - the request headers. Will be attached to the body in `HEADERS` property, if not falsy
* `detail.errors` - validation errors. Will prevent sending and
  trigger [`htmx:validation:halted`](@/events.md#htmx:validation:halted) event if not empty
* `detail.triggeringEvent` - the event that triggered sending
* `detail.messageBody` - raw message body that will be sent to the socket. Undefined, can be set to value of any type,
  supported by WebSockets. If set, will override
  default JSON serialization. Useful, if you want to use some other format, like XML or MessagePack
* `detail.elt` - the element that dispatched the sending (the one with `ws-send` attribute)
* `detail.socketWrapper` - the wrapper around socket object

#### Event - `htmx:wsBeforeSend` {#htmx:wsBeforeSend}

This event is triggered just before sending a message. This includes messages from the queue.
Message can not be modified at this point.

If the event is cancelled, the message will be discarded from the queue and not sent.

##### Details

* `detail.elt` - the element that dispatched the request (the one with `ws-connect` attribute)
* `detail.message` - the raw message content
* `detail.socketWrapper` - the wrapper around socket object

#### Event - `htmx:wsAfterSend` {#htmx:wsAfterSend}

This event is triggered just after sending a message. This includes messages from the queue.

Cancelling the event has no effect.

##### Details

* `detail.elt` - the element that dispatched the request (the one with `ws-connect` attribute)
* `detail.message` - the raw message content
* `detail.socketWrapper` - the wrapper around socket object

#### Socket wrapper

You may notice that all events expose `detail.socketWrapper` property. This wrapper holds the socket
object itself and the message queue. It also encapsulates reconnection algorithm. It exposes a few members:

- `send(message, fromElt)` - sends a message safely. If the socket is not open, the message will be persisted in the
  queue
  instead and sent when the socket is ready.
- `sendImmediately(message, fromElt)` - attempts to send a message regardless of socket state, bypassing the queue. May
  fail
- `queue` - an array of messages, awaiting in the queue.

This wrapper can be used in your event handlers to monitor and manipulate the queue (e.g., you can reset the queue when
reconnecting), and to send additional messages (e.g., if you want to send data in batches).
The `fromElt` parameter is optional and, when specified, will trigger corresponding websocket events from
specified element, namely `htmx:wsBeforeSend` and `htmx:wsAfterSend` events when sending your messages.

### Testing with the Demo Server

Htmx includes a demo WebSockets server written in Node.js that will help you to see WebSockets in action, and begin
bootstrapping your own WebSockets code. It is located in the /test/ws-sse folder of the htmx distribution. Look at
/test/ws-sse/README.md for instructions on running and using the test server.

### Migrating from Previous Versions

Previous versions of htmx used a built-in tag `hx-ws` to implement WebSockets. This code has been migrated into an
extension instead. Here are the steps you need to take to migrate to this version:

| Old Attribute           | New Attribute        | Comments                                                                                                                         |
|-------------------------|----------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `hx-ws=""`              | `hx-ext="ws"`        | Use the `hx-ext="ws"` attribute to install the WebSockets extension into any HTML element.                                       |
| `hx-ws="connect:<url>"` | `ws-connect="<url>"` | Add a new attribute `ws-connect` to the tag that defines the extension to specify the URL of the WebSockets server you're using. |
| `hx-ws="send"`          | `ws-send=""`         | Add a new attribute `ws-send` to mark any child forms that should send data to your WebSocket server                             |

+++
title = "server-sent-events"
+++

The `Server Sent Events` connects to an [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) directly from HTML.  It manages the connections to your web server, listens for server events, and then swaps their contents into your htmx webpage in real-time.

SSE is a lightweight alternative to WebSockets that works over existing HTTP connections, so it is easy to use through proxy servers and firewalls.  Remember, SSE is a uni-directional service, so you cannot send any messages to an SSE server once the connection has been established.  If you need bi-directional communication, then you should consider using [WebSockets](@/extensions/web-sockets.md) instead.

This extension replaces the experimental `hx-sse` attribute built into previous versions of htmx.  For help migrating from older versions, see the migration guide at the bottom of this page.

Use the following attributes to configure how SSE connections behave:

* `sse-connect="<url>"` - The URL of the SSE server.
* `sse-swap="<message-name>"` - The name of the message to swap into the DOM.
* `hx-swap` - You can control the swap strategy by using the [hx-swap](@/attributes/hx-swap.md) attribute, though note that modifiers like `scroll` are not supported.
* `hx-trigger="sse:<message-name>"` - SSE messages can also trigger HTTP callbacks using the [`hx-trigger`](@/attributes/hx-trigger.md) attribute.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/sse.js"></script>
```

## Usage

```html
  <div hx-ext="sse" sse-connect="/chatroom" sse-swap="message">
      Contents of this box will be updated in real time
      with every SSE message received from the chatroom.
  </div>
```

### Connecting to an SSE Server

To connect to an SSE server, use the `hx-ext="sse"` attribute to install the extension on that HTML element, then add `sse-connect="<url>"` to the element to make the connection.

When designing your server application, remember that SSE works just like any HTTP request.  Although you cannot send any messages to the server after you have established a connection, you can send parameters to the server along with your request.  So, instead of making an SSE connection to your server at `https://my-server/chat-updates` you can also connect to `https://my-server/chat-updates?friends=true&format=detailed`.  This allows your server to customize its responses to what your client needs.

### Receiving Named Events

SSE messages consist of an event name and a data packet.  No other metadata is allowed in the message.  Here is an example:

```txt
event: EventName
data: <div>Content to swap into your HTML page.</div>
```

We'll use the `sse-swap` attribute to listen for this event and swap its contents into our webpage.

```html
<div hx-ext="sse" sse-connect="/event-source" sse-swap="EventName"></div>
```

Notice that the name `EventName` from the server's message must match the value in the `sse-swap` attribute.  Your server can use as many different event names as necessary, but be careful: browsers can only listen for events that have been explicitly named.  So, if your server sends an event named `ChatroomUpdate` but your browser is only listening for events named `ChatUpdate` then the extra event will be discarded.

### Receiving Unnamed Events

SSE messages can also be sent without any event name.  In this case, the browser uses the default name `message` in its place.  The same rules specified above still apply.  If your server sends an unnamed message, then you must listen for it by including `sse-swap="message"`.  There is no option for using a catch-all name.  Here's how this looks:

```txt
data: <div>Content to swap into your HTML page.</div>
```

```html
<div hx-ext="sse" sse-connect="/event-source" sse-swap="message"></div>
```

### Receiving Multiple Events

You can also listen to multiple events (named or unnamed) from a single EventSource.  Listeners must be either 1) the same element that contains the `hx-ext` and `sse-connect` attributes, or 2) child elements of the element containing the `hx-ext` and `sse-connect` attributes.

```html

Multiple events in the same element
<div hx-ext="sse" sse-connect="/server-url" sse-swap="event1,event2"></div>

Multiple events in different elements (from the same source).
<div hx-ext="sse" sse-connect="/server-url">
    <div sse-swap="event1"></div>
    <div sse-swap="event2"></div>
</div>
```

### Trigger Server Callbacks

When a connection for server sent events has been established, child elements can listen for these events by using the special [`hx-trigger`](@/attributes/hx-trigger.md) syntax `sse:<event_name>`.  This, when combined with an `hx-get` or similar will trigger the element to make a request.

Here is an example:

```html
  <div hx-ext="sse" sse-connect="/event_stream">
    <div hx-get="/chatroom" hx-trigger="sse:chatter">
      ...
    </div>
  </div>
```

This example establishes an SSE connection to the `event_stream` end point which then triggers
a `GET` to the `/chatroom` url whenever the `chatter` event is seen.

### Automatic Reconnection

If the SSE Event Stream is closed unexpectedly, browsers are supposed to attempt to reconnect automatically.  However, in rare situations this does not work and your browser can be left hanging.  This extension adds its own reconnection logic (using an [exponential-backoff algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)) on top of the browser's automatic reconnection, so that your SSE streams will always be as reliable as possible.

### Testing SSE Connections with the Demo Server

Htmx includes a demo SSE server written in Node.js that will help you to see SSE in action, and begin bootstrapping your own SSE code.  It is located in the /test/ws-sse folder of the htmx distribution.  Look at /test/ws-sse/README.md for instructions on running and using the test server.

### Migrating from Previous Versions

Previous versions of htmx used a built-in tag `hx-sse` to implement Server Sent Events.  This code has been migrated into an extension instead.  Here are the steps you need to take to migrate to this version:

| Old Attribute                  | New Attribute            | Comments         |
|--------------------------------|--------------------------|------------------|
| `hx-sse=""`                    | `hx-ext="sse"`           | Use the `hx-ext="sse"` attribute to install the SSE extension into any HTML element. |
| `hx-sse="connect:<url>"`       | `sse-connect="<url>"`    | Add a new attribute `sse-connect` to the tag that specifies the URL of the Event Stream.  This attribute must be in the same tag as the `hx-ext` attribute. |
| `hx-sse="swap:<EventName>"`    | `sse-swap="<EventName>"` | Add a new attribute `sse-swap` to any elements that will be swapped in via the SSE extension.  This attribute must be placed **on** or **inside of** the tag containing the `hx-ext` attribute. |
| `hx-trigger="sse:<EventName>"` | NO CHANGE                | any `hx-trigger` attributes do not need to change.  The extension will identify these attributes and add listeners for any events prefixed with `sse:` |

### Additional SSE Resources

* [Wikipedia](https://en.wikipedia.org/wiki/Server-sent_events)
* [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
* [Can I Use?](https://caniuse.com/eventsource)

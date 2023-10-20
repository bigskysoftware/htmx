+++
title = "hx-sse"
+++

*Note: This attribute will be migrated to an extension in htmx 2.0, which is available now.  Please visit the
[SSE extension page](@/extensions/server-sent-events.md) to learn about the new implementation of SSE as an extension.*

The `hx-sse` allows you to work with [Server Sent Event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
`EventSource`s directly from HTML.  The value of the attribute can be one or more of the following, separated by white space:

* `connect:<url>` - A URL to establish an `EventSource` against
* `swap:<eventName>` - Swap SSE message content into a DOM node on matching event names

### Swap Message Content

When an SSE connection has been established (using the `connect` keyword) the contents of SSE messages can be swapped into the DOM using the `swap` keyword.  This can be done on the element that creates the SSE connection, or any child element of it.  Multiple elements can use `swap` to listen for Server Sent Events.

Here is an example:

```html
<div hx-sse="connect:/event_stream swap:eventName">
  ...
</div>
```

This example connects to a Server Sent Event stream, and begins swapping events named `eventName` into the same element.

Here is another example:

```html
<div hx-sse="connect:/event_stream">
  <div hx-sse="swap:eventName1">
    ...
  </div>
  <div hx-sse="swap:eventName2">
    ...
  </div>
</div>
```

This example connects the Server Sent Event stream to the parent node, and directs different events to different child nodes based on the event name returned by the server.

### Trigger Server Callbacks

When a connection for server sent events has been established, child elements can listen for these events by using the special [`hx-trigger`](@/attributes/hx-trigger.md) syntax `sse:<event_name>`.  This, when combined with an `hx-get` or similar will trigger the element to make a request.

Here is an example:

```html
  <div hx-sse="connect:/event_stream">
    <div hx-get="/chatroom" hx-trigger="sse:chatter">
      ...
    </div>
  </div>
```

This example establishes an SSE connection to the `event_stream` end point which then triggers
a `GET` to the `/chatroom` url whenever the `chatter` event is seen.

### Named Events

The Server Sent Event specification allows servers to optionally include an event name with every event.  **Named events** look like this:

```txt
event: EventName
data: <div>Content to swap into your HTML page.</div>
```

```html
<div hx-sse="connect:/server-url swap:eventName"></div>
```

### Data Only Events

Alternatively, servers can provide **data only events** that do not have a name.  In this case, Javascript (and HTMX) use the name "message" like this:

```txt
data: <div>Content to swap into your HTML page.</div>
```

```html
<div hx-sse="connect:/server-url swap:message"></div>
```

### Test SSE Server

Htmx includes an SSE test server with many more examples of how to use Server Sent Events.  Download the htmx source code from GitHub and navigate to /test/ws-sse to experiment.

## Notes

* `hx-sse` is not inherited

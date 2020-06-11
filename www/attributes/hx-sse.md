---
layout: layout.njk
title: </> htmx - hx-sse
---

## *EXPERIMENTAL* `hx-sse`

The `hx-sse` allows you to work with [Server Sent Event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
`EventSource`s directly from HTML.  The value of the attribute is of the following form:

* `connect <url>` - A URL to establish an `EventSource` against

When a connection for server sent events has been established, child elements can listen for these events by using
the special [`hx-trigger`](/attributes/hx-trigger) syntax `sse:<event_name>`.  This, when combined with an `hx-get`
or similar will trigger the element to make a request.

Here is an example:

```html
  <div hx-sse="connect /event_stream">
    <div hx-get="/chatroom" hx-trigger="chatter">
      ...
    </div>
  </div>
```

This example establishes an SSE connection to the `event_stream` end point which then triggers
a `GET` to the `/chatroom` url whenever the `chatter` event is seen.

### Notes

* `hx-sse` is not inherited

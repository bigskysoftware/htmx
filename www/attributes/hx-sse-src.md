---
layout: layout.njk
title: </> htmx - hx-sse
---

## `hx-sse`

The `hx-sse` allows you to work with [Server Sent Event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
`EventSource`s directly from HTML.  The value of the attribute can be one or more of the following, separated by
commas:

* `source:<url>` - A URL to establish an `EventSource` against
* `trigger:<event_name>` - An event name to trigger the element to make a request.  When an event with this name is recieved, the element
will trigger a request against whatever URL has been configured with `hx-get` or a similar attribute.

Here is an example:

```html
  <div hx-sse="source:/event_stream">
    <div hx-get="/chatroom" hx-sse="bind:chatter">
      ...
    </div>
  </div>
```

This example establishes an SSE connection to the `event_stream` end point which then triggers
a `GET` to the `/chatroom` url whenever the `chatter` event is seen.

### Notes

* `hx-sse` is not inherited

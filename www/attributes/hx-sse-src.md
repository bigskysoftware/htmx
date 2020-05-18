---
layout: layout.njk
title: </> htmx - hx-sse-src
---

## `hx-sse-src`

The `hx-sse-src` attribute establishes a [Server Sent Event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
`EventSource`, allowing children of the element to register for server sent event triggers.

```html
  <div hx-sse-src="/event_stream">
    <div hx-get="/chatroom" hx-trigger="sse:chatter">
      ...
    </div>
  </div>
```

This example establishes an SSE connection to the `event_stream` end point which then triggers
a `GET` to the `/chatroom` url whenever the `chatter` event is seen.

### Notes

* `hx-sse-src` is not inherited

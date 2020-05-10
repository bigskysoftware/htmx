---
layout: layout.njk
title: </> kutty - kt-sse-src
---

## `kt-sse-src`

The `kt-sse-src` attribute establishes a [Server Sent Event](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
`EventSource`, allowing children of the element to register for server sent event triggers.

```html
  <div kt-sse-src="/event_stream">
    <div kt-get="/chatroom" kt-trigger="sse:chatter">
      ...
    </div>
  </div>
```

This example establishes an SSE connection to the `event_stream` end point which then triggers
a `GET` to the `/chatroom` url whenever the `chatter` event is seen.

### Notes

* `kt-sse-src` is not inherited

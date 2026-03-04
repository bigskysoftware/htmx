---
title: "htmx:before:sse:stream"
description: "Before SSE stream connection opens"
---

# **`htmx:before:sse:stream`**

Fired before an SSE stream connection is opened.

## When It Fires

Before htmx establishes the EventSource connection for Server-Sent Events.

## Event Detail

- `ctx` - Request context for the SSE stream

## Example

```javascript
htmx.on('htmx:before:sse:stream', (evt) => {
  console.log('Opening SSE stream to:', evt.detail.ctx.request.action);
  // Show streaming indicator
});
```

Cancel this event to prevent the stream from being opened.

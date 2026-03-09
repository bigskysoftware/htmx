---
title: "htmx:after:sse:stream"
description: "After SSE stream closes"
---

Fired when an SSE stream connection closes.

## When It Fires

When the EventSource connection closes, either due to server ending it or network error.

## Event Detail

- `ctx` - Request context for the closed stream

## Example

```javascript
htmx.on('htmx:after:sse:stream', (evt) => {
  console.log('SSE stream closed');
  // Hide streaming indicator, show reconnection UI
});
```

The stream is fully closed at this point and will not receive more messages unless reconnected.

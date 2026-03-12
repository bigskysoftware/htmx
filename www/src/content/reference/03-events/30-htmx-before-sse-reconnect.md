---
title: "htmx:before:sse:reconnect"
description: "Before SSE stream reconnects"
---

The `htmx:before:sse:reconnect` event fires before htmx attempts to reconnect a dropped Server-Sent Events stream.

## When It Fires

When an SSE connection is lost and htmx is about to attempt reconnection.

## Event Detail

- `ctx` - Request context for the SSE stream
- `reconnect` - Reconnection attempt information (attempt number, delay)

## Example

```javascript
htmx.on('htmx:before:sse:reconnect', (evt) => {
  console.log('Reconnecting SSE, attempt:', evt.detail.reconnect.attempt);
  // Show reconnection message to user
});
```

Cancel this event to prevent the reconnection attempt.

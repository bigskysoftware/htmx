---
title: "htmx:before:sse:message"
description: "Before SSE message is processed"
---

# **`htmx:before:sse:message`**

Fired when an SSE message arrives, before htmx processes it.

## When It Fires

When the SSE stream receives a message from the server, before content swapping.

## Event Detail

- `ctx` - Request context
- `message` - Message object with `data`, `event`, and `id` properties

## Example

```javascript
htmx.on('htmx:before:sse:message', (evt) => {
  console.log('SSE message:', evt.detail.message.data);
  // Filter or modify message before processing
});
```

Cancel this event to skip processing this particular message.

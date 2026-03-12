---
title: "htmx:after:sse:message"
description: "After SSE message is processed"
---

The `htmx:after:sse:message` event fires after an SSE message has been processed and swapped into the DOM.

## When It Fires

After the message content has been successfully swapped.

## Event Detail

- `ctx` - Request context
- `message` - Message object with `data`, `event`, and `id` properties

## Example

```javascript
htmx.on('htmx:after:sse:message', (evt) => {
  console.log('SSE message processed:', evt.detail.message.id);
  // Update UI indicators, scroll to new content
});
```

The message has been fully processed at this point.

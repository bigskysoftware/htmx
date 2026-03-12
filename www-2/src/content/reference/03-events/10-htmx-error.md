---
title: "htmx:error"
description: "When an error occurs during request"
---

The `htmx:error` event fires when an exception occurs during the request or swap process.

## When It Fires

- Network errors (connection failed, timeout)
- Swap errors (invalid content, DOM errors)
- Any other exception during the htmx request lifecycle

## Event Detail

- `ctx` - Request context at time of error
- `error` - The exception object

## Example

```javascript
htmx.on('htmx:error', (evt) => {
  console.error('Request failed:', evt.detail.error);
  console.log('Context:', evt.detail.ctx);
  // Show error message to user
});
```

Use this for centralized error handling and user feedback.

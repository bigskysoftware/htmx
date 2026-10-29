---
title: "htmx:error"
description: "Fires after request or swap exception"
---

The `htmx:error` event fires when an exception occurs during the request or swap process.

## When It Fires

- Network errors (connection failed, timeout)
- Swap errors (invalid content, DOM errors)
- Any other exception during the htmx request lifecycle

This event does **not** fire for HTTP error statuses (4xx/5xx) — use [`htmx:response:error`](/reference/events/htmx-response-error) for those.

This event does **not** fire for intentional aborts triggered by [`hx-sync`](/reference/attributes/hx-sync) or the [`htmx:abort`](/reference/events/htmx-abort) event — only timeout aborts fire this event.

## Event Detail

- `ctx` - Request context at time of error
- `error` - The exception object

## Example

```javascript
htmx.on('htmx:error', (evt) => {
  const { error, ctx } = evt.detail;
  const msg = error?.name === 'AbortError' && ctx.request.signal.reason === 'timeout'
    ? 'Request timed out. Please try again.'
    : 'Something went wrong. Please try again.';
  showToast(msg);
});
```

Use this for centralized error handling and user feedback.

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

Timeouts and intentional aborts (`hx-sync` replace/abort, `htmx:abort`) both surface as a failed `fetch()`. Distinguish them with `ctx.request.signal.reason`: a timeout uses `TimeoutError` (`"Request timed out"`); a user or sync abort remains `AbortError`.

Use this for centralized error handling and user feedback.

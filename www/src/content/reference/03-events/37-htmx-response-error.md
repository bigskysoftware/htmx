---
title: "htmx:response:error"
description: "When an HTTP error status (4xx/5xx) is received"
---

The `htmx:response:error` event fires when the server responds with an HTTP error status code (400 or higher).

## When It Fires

After [`htmx:after:request`](/reference/events/htmx-after-request) and before the swap phase, when `response.status >= 400`.

This event does **not** fire for network errors or timeouts — use [`htmx:error`](/reference/events/htmx-error) for those.

## Event Detail

- `ctx` - The full request context, including:
  - `ctx.response.status` - The HTTP status code
  - `ctx.response.headers` - Response headers
  - `ctx.text` - The response body

## Example

```javascript
htmx.on('htmx:response:error', (evt) => {
  let status = evt.detail.ctx.response.status;
  console.error(`HTTP ${status} error`);
});
```

## Migration from htmx 2

This event replaces htmx 2's `htmx:responseError`. The event detail structure has changed — the response
information is now available via `evt.detail.ctx.response` rather than directly on `evt.detail`.

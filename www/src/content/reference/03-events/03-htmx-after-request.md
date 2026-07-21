---
title: "htmx:after:request"
description: "Immediately after fetch resolves"
---

The `htmx:after:request` event fires immediately after `fetch()` resolves and `ctx.response` is populated.

See the [request → response → swap lifecycle](/reference/events).

## When It Fires

Before [`htmx:before:response`](/reference/events/htmx-before-response) and before htmx reads the response body.

Cancelling this event has no effect.

## Event Detail

- `ctx` - Request context including response data

## Example

```javascript
htmx.on('htmx:after:request', (evt) => {
  console.log('Response status:', evt.detail.ctx.response.status);
});
```

The response is available but hasn't been swapped into the DOM yet.

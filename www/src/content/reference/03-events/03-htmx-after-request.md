---
title: "htmx:after:request"
description: "After response is received"
---

The `htmx:after:request` event fires immediately after the `fetch()` call resolves and the response is received.

## When It Fires

After the server responds, before content swapping occurs.

## Event Detail

- `ctx` - Request context including response data

## Example

```javascript
htmx.on('htmx:after:request', (evt) => {
  console.log('Response status:', evt.detail.ctx.response.status);
  // Hide loading indicator
});
```

The response is available but hasn't been swapped into the DOM yet.

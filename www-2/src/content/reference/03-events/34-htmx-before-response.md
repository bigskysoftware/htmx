---
title: "htmx:before:response"
description: "After a response is received but before the body is consumed"
---

Fired after a fetch response arrives but before htmx reads the response body.

## When It Fires

After the network response is received, before the body is consumed or any swap begins.

## Event Detail

- `ctx.response.raw` - The raw Response object (body not yet consumed)
- `ctx.response.status` - The HTTP status code
- `ctx.response.headers` - The response headers

## Example

```javascript
htmx.on('htmx:before:response', (evt) => {
  const status = evt.detail.ctx.response.status;
  const headers = evt.detail.ctx.response.headers;

  console.log('Response status:', status);
  console.log('Content-Type:', headers.get('content-type'));

  // Handle error status codes before body is consumed
  if (status >= 400) {
    console.log('Error response received');
  }
});
```

Cancel this event to skip normal response processing, including body consumption and the swap.

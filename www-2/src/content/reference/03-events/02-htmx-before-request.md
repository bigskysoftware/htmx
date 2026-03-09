---
title: "htmx:before:request"
description: "Immediately before fetch is called"
---

Fired immediately before the `fetch()` call is made.

## When It Fires

Right before the network request is sent, after all configuration and validation.

## Event Detail

- `ctx` - Request context object with final request configuration

## Example

```javascript
htmx.on('htmx:before:request', (evt) => {
  console.log('Sending request to:', evt.detail.ctx.request.action);
  // Show loading indicator
});
```

Cancel this event to prevent the request from being sent.

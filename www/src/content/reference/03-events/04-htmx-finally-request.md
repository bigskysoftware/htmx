---
title: "htmx:finally:request"
description: "Fires after lifecycle ends, including failures"
---

The `htmx:finally:request` event fires when request completes, fails, or is cancelled.

## When It Fires

After request processing ends. It does not fire if processing stops before the request begins issuing, such as after validation failure or cancellation of `htmx:config:request`.

## Event Detail

- `ctx` - Request context object

## Example

```javascript
htmx.on('htmx:finally:request', (evt) => {
  console.log('Request complete:', evt.detail.ctx);
  // Always hide loading indicator, clean up resources
});
```

Useful for cleanup operations started after the request begins issuing.

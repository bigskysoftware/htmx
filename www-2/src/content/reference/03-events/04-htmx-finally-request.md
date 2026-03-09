---
title: "htmx:finally:request"
description: "At the end of request lifecycle"
---

Fired at the very end of the request cycle, whether successful or failed.

## When It Fires

After all request processing completes, similar to a `finally` block in try/catch.

## Event Detail

- `ctx` - Request context object

## Example

```javascript
htmx.on('htmx:finally:request', (evt) => {
  console.log('Request complete:', evt.detail.ctx);
  // Always hide loading indicator, clean up resources
});
```

Useful for cleanup operations that should always run regardless of success or failure.

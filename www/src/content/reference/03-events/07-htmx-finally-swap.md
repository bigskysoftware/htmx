---
title: "htmx:finally:swap"
description: "At the end of swap lifecycle"
---

The `htmx:finally:swap` event fires at the very end of the swap cycle, whether successful or failed.

## When It Fires

After all swap processing completes, similar to a `finally` block in try/catch. Fires after [`htmx:after:swap`](/reference/events/htmx-after-swap) on the success path, or after an error if the swap fails.

## Event Detail

- `ctx` - Request context object

## Example

```javascript
htmx.on('htmx:finally:swap', (evt) => {
  console.log('Swap complete:', evt.detail.ctx);
  // Always hide loading indicator, clean up resources
});
```

Useful for cleanup operations that should always run after a swap, regardless of success or failure.

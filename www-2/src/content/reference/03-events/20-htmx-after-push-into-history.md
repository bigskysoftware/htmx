---
title: "htmx:after:push:into:history"
description: "After a push state action"
---

Fired specifically after a `history.pushState()` operation (creates new history entry).

## When It Fires

After a new history entry is pushed, allowing forward/back navigation to this point.

## Event Detail

- `path` - The path that was pushed into history

## Example

```javascript
htmx.on('htmx:after:push:into:history', (evt) => {
  console.log('Pushed to history:', evt.detail.path);
  // Track navigation in analytics
});
```

This creates a new entry in the browser's history stack.

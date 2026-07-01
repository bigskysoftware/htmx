---
title: "htmx:before:history:restore"
description: "Before restoring from history"
---

The `htmx:before:history:restore` event fires when the user navigates back or forward through history (popstate event).

## When It Fires

When the browser's back or forward button is clicked, before content is restored.

## Event Detail

- `path` - The path being restored
- `cacheMiss` - Boolean indicating if content needs to be fetched

## Example

```javascript
htmx.on('htmx:before:history:restore', (evt) => {
  console.log('Restoring:', evt.detail.path);
  if (evt.detail.cacheMiss) {
    console.log('Will fetch from server');
  }
});
```

Cancel this event to prevent history restoration and handle it manually.

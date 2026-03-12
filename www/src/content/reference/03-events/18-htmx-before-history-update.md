---
title: "htmx:before:history:update"
description: "Before browser history is updated"
---

The `htmx:before:history:update` event fires before htmx pushes or replaces a browser history state.

## When It Fires

Before `history.pushState()` or `history.replaceState()` is called.

## Event Detail

- `history` - Object with `type` ("push" or "replace") and `path`
- `sourceElement` - Element that triggered the navigation
- `response` - Response object

## Example

```javascript
htmx.on('htmx:before:history:update', (evt) => {
  console.log('Updating history:', evt.detail.history.type, evt.detail.history.path);
  // Modify path or cancel history update
});
```

Cancel this event to prevent the history update.

---
title: "htmx:after:history:update"
description: "After browser history is updated"
---

# **`htmx:after:history:update`**

Fired after htmx has updated the browser history state.

## When It Fires

After `history.pushState()` or `history.replaceState()` completes.

## Event Detail

- `history` - Object with `type` ("push" or "replace") and `path`
- `sourceElement` - Element that triggered the navigation
- `response` - Response object

## Example

```javascript
htmx.on('htmx:after:history:update', (evt) => {
  console.log('History updated to:', evt.detail.history.path);
  // Update analytics, breadcrumbs, etc.
});
```

The URL bar now reflects the new path.

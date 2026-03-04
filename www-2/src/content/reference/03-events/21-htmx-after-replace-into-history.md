---
title: "htmx:after:replace:into:history"
description: "After a replace state action"
---

# **`htmx:after:replace:into:history`**

Fired specifically after a `history.replaceState()` operation (replaces current history entry).

## When It Fires

After the current history entry is replaced, without creating a new back button entry.

## Event Detail

- `path` - The path that replaced the current history entry

## Example

```javascript
htmx.on('htmx:after:replace:into:history', (evt) => {
  console.log('Replaced history with:', evt.detail.path);
});
```

This modifies the current history entry without affecting the back button.

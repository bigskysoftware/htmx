---
title: "htmx:after:history:replace"
description: "After a replace state action"
---

The `htmx:after:history:replace` event fires specifically after a `history.replaceState()` operation (replaces current history entry).

## When It Fires

After the current history entry is replaced, without creating a new back button entry.

## Event Detail

- `path` - The path that replaced the current history entry

## Example

```javascript
htmx.on('htmx:after:history:replace', (evt) => {
  console.log('Replaced history with:', evt.detail.path);
});
```

This modifies the current history entry without affecting the back button.

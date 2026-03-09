---
title: "htmx:after:restore"
description: "After preserved elements are restored"
---

Fired after elements marked with `hx-preserve` have been moved back into their original positions.

## When It Fires

After a swap operation that includes preserved elements, once they've been restored to the new content.

## Event Detail

- `ctx` - Request context

## Example

```javascript
htmx.on('htmx:after:restore', (evt) => {
  console.log('Preserved elements restored');
  // Re-attach listeners to preserved elements if needed
});
```

Preserved elements maintain their state across swaps.

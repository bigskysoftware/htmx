---
title: "htmx:after:viewTransition"
description: "After View Transition completes"
---

The `htmx:after:viewTransition` event fires after a View Transition animation completes.

## When It Fires

After the View Transition API finishes animating the swap operation.

## Event Detail

- `task` - Transition callback information

## Example

```javascript
htmx.on('htmx:after:viewTransition', (evt) => {
  console.log('View transition complete');
  // Perform actions after transition animation
});
```

The swap and transition are both complete at this point.

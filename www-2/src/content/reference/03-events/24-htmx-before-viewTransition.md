---
title: "htmx:before:viewTransition"
description: "Before View Transition API starts"
---

Fired before a View Transition starts (if browser supports View Transitions API and `htmx.config.transitions` is
`true`).

## When It Fires

Before the swap operation begins its view transition animation.

## Event Detail

- `task` - Transition callback function

## Example

```javascript
htmx.on('htmx:before:viewTransition', (evt) => {
  console.log('Starting view transition');
  // Customize transition behavior
});
```

Cancel this event to skip the view transition for this swap.

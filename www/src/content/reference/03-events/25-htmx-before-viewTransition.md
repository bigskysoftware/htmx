---
title: "htmx:before:viewTransition"
description: "Fires before view transition starts"
---

The `htmx:before:viewTransition` event fires before a View Transition starts (if browser supports View Transitions API and `htmx.config.transitions` is
`true`).

## When It Fires

Before the swap operation begins its view transition animation.

Fires on the element that triggered the swap, or on `document` when there is none.

## Event Detail

- `task` - Transition callback function. Replace it to wrap the transition.
- `ctx` - The request context driving the swap

## Example

```javascript
htmx.on('htmx:before:viewTransition', (evt) => {
  console.log('Starting view transition');
  // Customize transition behavior
});
```

Replace `detail.task` to run your own work around the transition. The
replacement is awaited in place of the original:

```javascript
htmx.on('htmx:before:viewTransition', (evt) => {
  let task = evt.detail.task;
  evt.detail.task = async () => {
    await prepare(evt.detail.ctx);
    await task();
  };
});
```

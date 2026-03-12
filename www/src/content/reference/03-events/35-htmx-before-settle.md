---
title: "htmx:before:settle"
description: "Before the settle phase begins after a swap"
---

The `htmx:before:settle` event fires after new content is inserted into the DOM but before CSS transitions are applied.

## When It Fires

After the swap completes, right before htmx runs the settle phase (which applies CSS transitions and removes old attributes).

## Event Detail

- `task` - The swap task being settled
- `newContent` - Array of newly inserted elements
- `settleTasks` - Array of pending settle callbacks (e.g. CSS transition steps)

## Example

```javascript
htmx.on('htmx:before:settle', (evt) => {
  console.log('About to settle', evt.detail.newContent.length, 'element(s)');
  // Modify elements before transitions run
});
```

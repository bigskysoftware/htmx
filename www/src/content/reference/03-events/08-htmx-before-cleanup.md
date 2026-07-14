---
title: "htmx:before:cleanup"
description: "Before htmx removes element data"
---

The `htmx:before:cleanup` event fires before htmx removes listeners and internal data from an element.

## When It Fires

- Before an element is removed from the DOM during a swap
- Before htmx re-processes an element

## Event Detail

Empty - no additional context provided.

## Example

```javascript
htmx.on('htmx:before:cleanup', (evt) => {
  console.log('Cleaning up:', evt.target);
  // Save state or clean up custom data
});
```

Use this to perform cleanup operations before htmx removes its data.

---
title: "htmx:after:cleanup"
description: "After listeners and data are removed"
---

The `htmx:after:cleanup` event fires after htmx has removed all listeners and internal data from an element.

## When It Fires

- After an element has been removed from the DOM
- After htmx has detached all event listeners

## Event Detail

Empty - no additional context provided.

## Example

```javascript
htmx.on('htmx:after:cleanup', (evt) => {
  console.log('Cleanup complete:', evt.target);
});
```

The element no longer has htmx behaviors attached at this point.

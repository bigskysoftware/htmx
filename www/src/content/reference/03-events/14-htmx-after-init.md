---
title: "htmx:after:init"
description: "Fires after element initialization"
---

The `htmx:after:init` event fires after an element has been fully initialized and all event listeners have been attached.

## When It Fires

After htmx has completely set up an element with all its behaviors, triggers, and event listeners.

## Event Detail

Empty - no additional context provided.

## Example

```javascript
htmx.on('htmx:after:init', (evt) => {
  console.log('Element ready:', evt.target);
  // Element is fully initialized and ready for interaction
});
```

The element is fully ready for htmx interactions at this point.

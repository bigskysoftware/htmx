---
title: "load"
description: "Fired immediately after initialization"
---

# **`load`**

Fired immediately after element initialization, mimicking the standard DOM `load` event.

## When It Fires

Right after `htmx:after:init`, providing a familiar event name for developers.

## Event Detail

Empty - no additional context provided.

## Example

```javascript
document.addEventListener('load', (evt) => {
  if (evt.target.hasAttribute('hx-get')) {
    console.log('htmx element loaded:', evt.target);
  }
});
```

This provides compatibility with standard DOM patterns.

---
title: "htmx:before:init"
description: "Before a specific element is initialized"
---

Fired before a specific element is initialized with htmx metadata.

## When It Fires

During element processing, before htmx attaches its internal metadata structure to the element.

## Event Detail

Empty - no additional context provided.

## Example

```javascript
htmx.on('htmx:before:init', (evt) => {
  console.log('Initializing element:', evt.target);
});
```

This runs early in the initialization lifecycle, before attributes are fully parsed.

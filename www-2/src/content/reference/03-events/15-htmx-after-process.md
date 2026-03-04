---
title: "htmx:after:process"
description: "After htmx processes a DOM node"
---

# **`htmx:after:process`**

Fired after htmx has finished processing a DOM node or subtree.

## When It Fires

- After initial page load processing completes
- After new content has been processed and behaviors attached
- After `htmx.process()` completes

## Event Detail

Empty - no additional context provided.

## Example

```javascript
htmx.on('htmx:after:process', (evt) => {
  console.log('Finished processing:', evt.target);
  // Initialize third-party widgets on processed content
});
```

This is useful for initializing JavaScript widgets after htmx processes new content.

---
title: "htmx:after:settle"
description: "After the settle phase completes"
---

Fired after htmx finishes the settle phase, including any CSS transitions.

## When It Fires

After all settle tasks (CSS transitions, attribute cleanup) have completed for newly swapped content.

## Event Detail

- `task` - The swap task that was settled
- `newContent` - Array of settled elements
- `settleTasks` - Array of settle tasks that ran

## Example

```javascript
htmx.on('htmx:after:settle', (evt) => {
  console.log('Settle complete for', evt.detail.newContent.length, 'element(s)');
  // Safe to interact with fully-settled DOM
});
```

The DOM is fully stable at this point — all transitions have run and temporary attributes have been cleaned up.

---
title: "htmx:before:swap"
description: "Before content is swapped into DOM"
---

The `htmx:before:swap` event fires after response content is parsed but before it's inserted or swapped into the DOM.

## When It Fires

After the response is received and parsed, but before any DOM modifications occur.

## Event Detail

- `ctx` - Request context including parsed response
- `tasks` - Array of swap tasks to be performed

## Example

```javascript
htmx.on('htmx:before:swap', (evt) => {
  console.log('About to swap:', evt.detail.ctx.response);
  // Modify response before swapping
  // Or cancel swap by calling evt.preventDefault()
});
```

Cancel this event to prevent the swap from occurring.

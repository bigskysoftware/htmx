---
title: "htmx:after:swap"
description: "After content is swapped into DOM"
---

Fired after new content has been swapped into the DOM.

## When It Fires

Immediately after the DOM swap operation completes, before elements are processed.

## Event Detail

- `ctx` - Request context including swap details

## Example

```javascript
htmx.on('htmx:after:swap', (evt) => {
  console.log('Content swapped into:', evt.detail.ctx.target);
  // Initialize widgets, scroll to position, etc.
});
```

The new content is in the DOM but may not be fully processed by htmx yet.

---
title: "htmx:after:swap"
description: "After content is swapped into DOM"
---

The `htmx:after:swap` event fires after new content has been swapped into the DOM.

See the [request → response → swap lifecycle](/reference/events).

## When It Fires

Immediately after the DOM swap operation completes, before elements are processed.

## Event Detail

- `ctx` - Request context including swap details

## Example

```javascript
htmx.on('htmx:after:swap', (evt) => {
  console.log('Target input:', evt.detail.ctx.swap.target);
  // Initialize widgets, scroll to position, etc.
});
```

`ctx.swap.target` retains its selector or explicit `Element` input. The new content is in the DOM but may not be fully processed by htmx yet.

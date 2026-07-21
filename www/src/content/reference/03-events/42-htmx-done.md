---
title: "htmx:done"
description: "When the request → response → swap pipeline ends"
---

The `htmx:done` event fires when the request → response → swap pipeline ends, whether it completes, is cancelled, or fails.

See the [request → response → swap lifecycle](/reference/events).

## When It Fires

After the pipeline ends and before the next queued request starts.

## Event Detail

- `ctx` - Request context object

## Example

```javascript
htmx.on('htmx:done', (evt) => {
  console.log('Done:', evt.detail.ctx);
});
```

Use this event for work that must run after every outcome.

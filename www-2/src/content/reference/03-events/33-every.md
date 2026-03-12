---
title: "every"
description: "Periodic polling trigger"
---

Fired periodically at a specified interval, used for polling.

## When It Fires

At regular intervals specified in the [`hx-trigger`](/reference/attributes/hx-trigger) attribute (e.g., `every 2s`).

## Event Detail

Empty - no additional context provided.

## Example

```html
<div hx-get="/status" hx-trigger="every 5s">
  Status updates every 5 seconds
</div>
```

```javascript
htmx.on('every', (evt) => {
  console.log('Polling:', evt.target);
});
```

Useful for live updates, status checks, and real-time data display.

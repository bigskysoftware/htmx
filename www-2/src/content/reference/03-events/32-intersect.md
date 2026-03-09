---
title: "intersect"
description: "Element enters viewport"
---

Fired when an element enters the viewport, detected via IntersectionObserver.

## When It Fires

When an element becomes visible in the viewport, used by `hx-trigger="intersect"`.

## Event Detail

Empty - no additional context provided.

## Example

```html
<div hx-get="/lazy-content" hx-trigger="intersect">
  Content loads when scrolled into view
</div>
```

```javascript
htmx.on('intersect', (evt) => {
  console.log('Element visible:', evt.target);
});
```

This enables lazy loading and infinite scroll patterns.

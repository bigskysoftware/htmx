---
title: "intersect"
description: "Fires when element enters viewport"
---

The `intersect` event fires when an observed element enters the viewport, detected via IntersectionObserver. It is dispatched on the observed element.

`revealed` is identical except it disconnects the observer after the first intersection, so it fires exactly once.

## When It Fires

Used by [`hx-trigger`](/reference/attributes/hx-trigger)`="intersect"` and `hx-trigger="revealed"`. Also fires when `from:<selector>` is used on either — the event is dispatched on the `from` element when it intersects.

## Event Detail

Empty - no additional context provided.

## Example

```html
<!-- fires every time element intersects -->
<div hx-get="/lazy-content" hx-trigger="intersect">...</div>

<!-- fires once -->
<div hx-get="/lazy-content" hx-trigger="revealed">Loading...</div>

<!-- observe a different element -->
<div hx-get="/more" hx-trigger="intersect from:#sentinel">...</div>
```

```javascript
htmx.on('#lazy', 'intersect', (evt) => {
  console.log('Element visible:', evt.target);
});
```

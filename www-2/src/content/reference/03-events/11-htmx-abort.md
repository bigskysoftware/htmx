---
title: "htmx:abort"
description: "Trigger to abort an ongoing request"
---

# **`htmx:abort`**

A control event that, when fired on an element, aborts its ongoing request.

## When To Fire It

Fire this event to programmatically cancel a request that's in progress.

## Event Detail

Not applicable - this is a control event you trigger, not one you listen for.

## Example

```javascript
// Abort request on a specific element
htmx.trigger('#myElement', 'htmx:abort');

// Abort all requests in a container
document.querySelectorAll('#container [hx-get]').forEach(el => {
  htmx.trigger(el, 'htmx:abort');
});
```

The element's ongoing request will be cancelled when this event is received.

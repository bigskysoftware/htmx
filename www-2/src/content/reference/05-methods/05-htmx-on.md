---
title: "htmx.on()"
description: "Listen for htmx events"
---

# **`htmx.on()`**

The `htmx.on()` function registers an event listener for htmx events.

## Syntax

```javascript
// Listen on document
htmx.on(event, callback)

// Listen on specific element
htmx.on(element, event, callback)
```

## Parameters

- `event` - Event name to listen for
- `callback` - Function to call when event fires
- `element` - Optional element to listen on (defaults to document)

## Example

```javascript
// Listen for all htmx requests
htmx.on('htmx:before:request', (evt) => {
  console.log('Request starting:', evt.detail);
});

// Listen on specific element
htmx.on('#myForm', 'htmx:after:swap', (evt) => {
  console.log('Form updated');
});
```

## Return Value

Returns the callback function, which can be used to remove the listener later.

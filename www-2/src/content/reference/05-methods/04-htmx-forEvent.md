---
title: "htmx.forEvent()"
description: "Wait for an event with optional timeout"
---

# **`htmx.forEvent()`**

The `htmx.forEvent()` function creates a promise that resolves when a specific event fires.

## Syntax

```javascript
await htmx.forEvent(event, timeout, on)
```

## Parameters

- `event` - Event name to wait for
- `timeout` - Optional timeout in ms (resolves with `null` if exceeded)
- `on` - Optional element to listen on (defaults to document)

## Example

```javascript
// Wait for custom event
let evt = await htmx.forEvent('dataLoaded');
console.log('Data loaded:', evt.detail);

// Wait with timeout
let result = await htmx.forEvent('userAction', 5000);
if (result === null) {
  console.log('Timeout - no user action');
}

// Wait on specific element
let evt = await htmx.forEvent('htmx:after:swap', null, myElement);
```

## Return Value

Returns a Promise that resolves with the event object, or `null` if timeout is reached.

---
title: "htmx.trigger()"
description: "Trigger custom events"
---

The `htmx.trigger()` function dispatches a custom event on an element.

## Syntax

```javascript
htmx.trigger(element, eventName, detail, bubbles)
```

## Parameters

- `element` - Element or CSS selector to trigger event on
- `eventName` - Name of the event to trigger
- `detail` - Optional detail object to pass with event (default: `{}`)
- `bubbles` - Whether event bubbles (default: `true`)

## Example

```javascript
// Trigger event on element
htmx.trigger('#myElement', 'customEvent', {
  message: 'Hello'
});

// Trigger without bubbling
htmx.trigger(document.body, 'myEvent', {}, false);
```

## Return Value

Returns `true` if the event was not cancelled, `false` otherwise.

---
title: "htmx.onLoad()"
description: "Executes callback when elements load"
---

The `htmx.onLoad()` function registers a callback to execute when new content is processed by htmx.

## Syntax

```javascript
htmx.onLoad(callback)
```

## Parameters

- `callback` - Function to call with the loaded element

## Example

```javascript
htmx.onLoad((element) => {
  console.log('New content loaded:', element);
  // Initialize widgets, attach listeners, etc.
});
```

This is useful for initializing JavaScript widgets or attaching event listeners to dynamically loaded content.

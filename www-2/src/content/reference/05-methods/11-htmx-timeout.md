---
title: "htmx.timeout()"
description: "Create a timeout promise"
---

# **`htmx.timeout()`**

The `htmx.timeout()` function creates a promise that resolves after a specified time interval.

## Syntax

```javascript
await htmx.timeout(time)
```

## Parameters

- `time` - Time to wait (number in ms or string like "2s", "500ms")

## Example

```javascript
// Wait 2 seconds
await htmx.timeout("2s");
console.log("2 seconds passed");

// Wait 1000ms
await htmx.timeout(1000);
console.log("1 second passed");
```

## Return Value

Returns a Promise that resolves after the specified time. If time is 0 or negative, resolves immediately.

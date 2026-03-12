---
title: "htmx.parseInterval()"
description: "Parse time intervals to milliseconds"
---

The `htmx.parseInterval()` function parses time interval strings into milliseconds.

## Syntax

```javascript
htmx.parseInterval(str)
```

## Parameters

- `str` - Time interval as number or string (e.g., "2s", "500ms", "1m")

## Supported Units

- `ms` - milliseconds (default if no unit specified)
- `s` - seconds
- `m` - minutes

## Example

```javascript
htmx.parseInterval(1000)      // 1000 (already in ms)
htmx.parseInterval("2s")      // 2000
htmx.parseInterval("500ms")   // 500
htmx.parseInterval("1.5m")    // 90000
```

## Return Value

Returns the interval in milliseconds, or `undefined` if parsing fails.

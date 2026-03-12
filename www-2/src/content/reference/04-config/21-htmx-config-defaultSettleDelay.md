---
title: "htmx.config.defaultSettleDelay"
description: "Delay between the swap and settle phases in milliseconds"
---

The `htmx.config.defaultSettleDelay` option controls how long htmx waits between the swap phase and the settle phase (when CSS transition classes are removed).

**Default:** `1` (1 millisecond)

## Example

```javascript
htmx.config.defaultSettleDelay = 100;
```

```html
<meta name="htmx-config" content='{"defaultSettleDelay":100}'>
```

Increase this value if CSS transitions are not completing before htmx removes the transition classes.

See also: [`htmx.config`](/reference/config/htmx-config)

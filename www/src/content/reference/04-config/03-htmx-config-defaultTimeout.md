---
title: "htmx.config.defaultTimeout"
description: "Sets default request timeout in `ms`"
---

The `htmx.config.defaultTimeout` option sets the default timeout for all htmx requests.

**Default:** `60000` (60 seconds)

## Example

```javascript
htmx.config.defaultTimeout = 30000; // 30 seconds
```

```html
<meta name="htmx-config" content='{"defaultTimeout":30000}'>
```

Requests that exceed this timeout will be aborted.

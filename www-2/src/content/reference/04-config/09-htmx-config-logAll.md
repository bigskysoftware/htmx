---
title: "htmx.config.logAll"
description: "Log all htmx events to console"
---

The `htmx.config.logAll` option, when set to `true`, causes htmx to log all events to the console.

**Default:** `false`

## Example

```javascript
htmx.config.logAll = true;
```

```html
<meta name="htmx-config" content='{"logAll":true}'>
```

Useful for debugging htmx behavior during development.

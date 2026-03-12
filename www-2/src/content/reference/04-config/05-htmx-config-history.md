---
title: "htmx.config.history"
description: "Enable history support"
---

The `htmx.config.history` option, when set to `true`, enables htmx to manage browser history for navigation.

**Default:** `true`

## Example

```javascript
htmx.config.history = false;
```

```html
<meta name="htmx-config" content='{"history":false}'>
```

Disabling this prevents htmx from updating the browser's URL history.

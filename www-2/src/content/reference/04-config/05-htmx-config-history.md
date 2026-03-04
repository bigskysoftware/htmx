---
title: "htmx.config.history"
description: "Enable history support"
---

# **`htmx.config.history`**

When set to `true`, htmx will manage browser history for navigation.

**Default:** `true`

## Example

```javascript
htmx.config.history = false;
```

```html
<meta name="htmx-config" content='{"history":false}'>
```

Disabling this prevents htmx from updating the browser's URL history.

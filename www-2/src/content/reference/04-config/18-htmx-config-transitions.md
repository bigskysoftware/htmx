---
title: "htmx.config.transitions"
description: "Enable View Transitions API support"
---

When set to `true`, htmx will use the View Transitions API for smooth animations between page updates.

**Default:** `true`

## Example

```javascript
htmx.config.transitions = false;
```

```html
<meta name="htmx-config" content='{"transitions":false}'>
```

Requires browser support for the View Transitions API.

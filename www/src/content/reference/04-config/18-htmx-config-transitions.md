---
title: "htmx.config.transitions"
description: "Enable View Transitions API support"
---

The `htmx.config.transitions` option, when set to `true`, causes htmx to use the View Transitions API for smooth animations between page updates.

**Default:** `false`

## Example

```javascript
htmx.config.transitions = false;
```

```html
<meta name="htmx-config" content='{"transitions":false}'>
```

Requires browser support for the View Transitions API.

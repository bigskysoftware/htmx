---
title: "htmx.config.indicatorClass"
description: "CSS class for loading indicators"
---

CSS class applied to elements specified by [`hx-indicator`](/reference/attributes/hx-indicator) during requests.

**Default:** `"htmx-indicator"`

## Example

```javascript
htmx.config.indicatorClass = "loading";
```

```html
<meta name="htmx-config" content='{"indicatorClass":"loading"}'>
```

Elements with this class can be styled to show loading states.

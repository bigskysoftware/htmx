---
title: "htmx.config.requestClass"
description: "CSS class applied during requests"
---

# **`htmx.config.requestClass`**

CSS class automatically applied to the element making a request.

**Default:** `"htmx-request"`

## Example

```javascript
htmx.config.requestClass = "is-loading";
```

```html
<meta name="htmx-config" content='{"requestClass":"is-loading"}'>
```

Use this class to style elements while they're making requests.

---
title: "htmx.config.mode"
description: "Set request mode for fetch API"
---

# **`htmx.config.mode`**

Sets the `mode` option for fetch requests.

**Default:** `"same-origin"`

## Valid Values

- `"same-origin"` - Only allow same-origin requests
- `"cors"` - Allow cross-origin requests
- `"no-cors"` - Limited cross-origin requests
- `"navigate"` - Navigation mode

## Example

```javascript
htmx.config.mode = "cors";
```

```html
<meta name="htmx-config" content='{"mode":"cors"}'>
```

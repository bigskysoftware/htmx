---
title: "htmx.config.prefix"
description: "Set a custom attribute prefix"
---

# **`htmx.config.prefix`**

Allows you to use a custom prefix for htmx attributes instead of `hx-`.

**Default:** `""` (no prefix, use `hx-`)

## Example

```javascript
htmx.config.prefix = "data-hx-";
```

```html
<meta name="htmx-config" content='{"prefix":"data-hx-"}'>
```

Now you can use `data-hx-get` instead of `hx-get`, etc.

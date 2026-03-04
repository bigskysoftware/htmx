---
title: "htmx.config.noSwap"
description: "HTTP status codes that skip swap"
---

# **`htmx.config.noSwap`**

Array of HTTP status codes for which htmx will not perform a content swap.

**Default:** `[204, 304]`

## Example

```javascript
htmx.config.noSwap = [204, 304, 205];
```

```html
<meta name="htmx-config" content='{"noSwap":[204,304,205]}'>
```

Responses with these status codes will trigger events but won't swap content.

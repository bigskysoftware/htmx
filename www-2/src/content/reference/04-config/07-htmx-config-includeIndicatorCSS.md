---
title: "htmx.config.includeIndicatorCSS"
description: "Include default indicator CSS"
---

The `htmx.config.includeIndicatorCSS` option, when set to `true`, causes htmx to include default CSS for the indicator class.

**Default:** `true`

## Example

```javascript
htmx.config.includeIndicatorCSS = false;
```

```html
<meta name="htmx-config" content='{"includeIndicatorCSS":false}'>
```

Set to `false` if you want to provide your own indicator styles.

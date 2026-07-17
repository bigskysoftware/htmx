---
title: "htmx.config.includeIndicatorCSS"
description: "Includes built-in loading indicator CSS"
---

The `htmx.config.includeIndicatorCSS` option controls whether htmx adds built-in loading indicator styles.

The styles hide [`indicatorClass`](/reference/config/htmx-config-indicatorClass) content until [`requestClass`](/reference/config/htmx-config-requestClass) marks it as active.

**Default:** `true`

## Usage

Disable built-in styles when providing your own:

```html
<meta name="htmx-config" content="includeIndicatorCSS:false">
```

## See Also

- [`hx-indicator`](/reference/attributes/hx-indicator)
- [`htmx.config.indicatorClass`](/reference/config/htmx-config-indicatorClass)
- [`htmx.config.requestClass`](/reference/config/htmx-config-requestClass)

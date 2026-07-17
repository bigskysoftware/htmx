---
title: "htmx.config.requestClass"
description: "Sets class applied during requests"
---

The `htmx.config.requestClass` option sets the CSS class htmx adds while a request is running.

htmx adds it to the element selected by [`hx-indicator`](/reference/attributes/hx-indicator). Without `hx-indicator`, htmx adds it to the request source.

**Default:** `"htmx-request"`

## Usage

Use a custom request-state class:

```html
<meta name="htmx-config" content='requestClass:"is-loading"'>
```

```css
.is-loading {
  opacity: 0.5;
}
```

htmx removes the class when the request ends.

## See Also

- [`hx-indicator`](/reference/attributes/hx-indicator)
- [`htmx.config.includeIndicatorCSS`](/reference/config/htmx-config-includeIndicatorCSS)
- [`htmx.config.indicatorClass`](/reference/config/htmx-config-indicatorClass)

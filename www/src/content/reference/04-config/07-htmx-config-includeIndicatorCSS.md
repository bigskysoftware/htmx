---
title: "htmx.config.includeIndicatorCSS"
description: "Includes built-in loading indicator CSS"
---

The `htmx.config.includeIndicatorCSS` option controls whether htmx adds built-in loading indicator styles.

The styles hide [`indicatorClass`](/reference/config/htmx-config-indicatorClass) content until [`requestClass`](/reference/config/htmx-config-requestClass) marks it as active.

**Default:** `true`

## Syntax

Disable built-in styles when providing your own:

```html
<meta name="htmx-config" content="includeIndicatorCSS:false">
```

## Advanced: Accessing the Stylesheet at Runtime

When `includeIndicatorCSS` is `true`, htmx exposes the injected [`CSSStyleSheet`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet) as `htmx.indicatorStyleSheet`.

Modify the rules in place:

```js
htmx.indicatorStyleSheet.replaceSync(`
  .htmx-indicator { display: none }
  .htmx-request .htmx-indicator, .htmx-request.htmx-indicator { display: inline }
`);
```

Or remove it from the document entirely:

```js
document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
  s => s !== htmx.indicatorStyleSheet
);
```

## See Also

- [`hx-indicator`](/reference/attributes/hx-indicator)
- [`htmx.config.indicatorClass`](/reference/config/htmx-config-indicatorClass)
- [`htmx.config.requestClass`](/reference/config/htmx-config-requestClass)

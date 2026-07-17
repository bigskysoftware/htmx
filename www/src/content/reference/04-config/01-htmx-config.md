---
title: "htmx.config"
description: "Configures htmx behavior globally"
---

The `htmx.config` object holds the current htmx configuration. You can modify it in JavaScript or set values using a `<meta>` tag.

## Configure via Meta Tag

Set config values with [HCON](/docs#hcon):

```html
<meta name="htmx-config"
      content="defaultSwap:outerHTML defaultTimeout:5000">
```

Or JSON:

```html
<meta name="htmx-config"
      content='{"defaultSwap":"outerHTML","defaultTimeout":5000}'>
```

## Configure via JavaScript

Modify config values directly:

```javascript
htmx.config.defaultSwap = 'outerHTML';
htmx.config.defaultTimeout = 5000;
```

## Available Options

| Option | Default | Description |
|--------|---------|-------------|
| [`logAll`](/reference/config/htmx-config-logAll) | `false` | Log all htmx events |
| [`prefix`](/reference/config/htmx-config-prefix) | `"data-hx-"` | Secondary attribute prefix recognized alongside `hx-` |
| [`metaCharacter`](/reference/config/htmx-config-metaCharacter) | `undefined` | Character used instead of `:` in attribute names |
| [`transitions`](/reference/config/htmx-config-transitions) | `false` | Enable view transitions |
| [`history`](/reference/config/htmx-config-history) | `true` | Enable history support |
| [`mode`](/reference/config/htmx-config-mode) | `"same-origin"` | Request mode for `fetch()` |
| [`defaultSwap`](/reference/config/htmx-config-defaultSwap) | `"innerHTML"` | Default swap style |
| [`defaultSwapEmpty`](/reference/config/htmx-config-defaultSwapEmpty) | `undefined` | Swap empty main content unless an `<hx-partial>` was extracted |
| [`defaultFocusScroll`](/reference/config/htmx-config-defaultFocusScroll) | `false` | Scroll to a focused element after swapping |
| [`defaultSettleDelay`](/reference/config/htmx-config-defaultSettleDelay) | `1` | Delay before settling in milliseconds |
| [`indicatorClass`](/reference/config/htmx-config-indicatorClass) | `"htmx-indicator"` | CSS class for indicators |
| [`requestClass`](/reference/config/htmx-config-requestClass) | `"htmx-request"` | CSS class during requests |
| [`includeIndicatorCSS`](/reference/config/htmx-config-includeIndicatorCSS) | `true` | Include default indicator CSS |
| [`defaultTimeout`](/reference/config/htmx-config-defaultTimeout) | `60000` | Request timeout in milliseconds |
| [`extensions`](/reference/config/htmx-config-extensions) | `""` | Extensions to load |
| [`morphIgnore`](/reference/config/htmx-config-morphIgnore) | `["data-htmx-powered"]` | Attributes to ignore during morphing |
| [`morphSkip`](/reference/config/htmx-config-morphSkip) | `"[hx-morph-skip]"` | Elements to skip while morphing |
| [`morphSkipChildren`](/reference/config/htmx-config-morphSkipChildren) | `"[hx-morph-skip-children]"` | Elements whose children are not morphed |
| [`morphScanLimit`](/reference/config/htmx-config-morphScanLimit) | `10` | Siblings scanned while matching elements |
| [`noSwap`](/reference/config/htmx-config-noSwap) | `[204, 304]` | HTTP status codes that skip swaps |
| [`implicitInheritance`](/reference/config/htmx-config-implicitInheritance) | `false` | Enable implicit attribute inheritance |
| [`inlineScriptNonce`](/reference/config/htmx-config-inlineScriptNonce) | `undefined` | Nonce added to inline scripts |

## See Also

- [HCON](/docs#hcon)
- [`hx-config`](/reference/attributes/hx-config)

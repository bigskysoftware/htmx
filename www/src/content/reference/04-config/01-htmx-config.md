---
title: "htmx.config"
description: "Configure htmx behavior globally"
---

The `htmx.config` object holds the current htmx configuration. You can modify it in JavaScript or set values using a `<meta>` tag.

## Configuration via Meta Tag

Set config values in your HTML `<head>`:

```html
<meta name="htmx-config" content='{"defaultSwap":"outerHTML","defaultTimeout":5000}'>
```

## Configuration via JavaScript

Modify config values directly:

```javascript
htmx.config.defaultSwap = 'outerHTML';
htmx.config.defaultTimeout = 5000;
```

## Available Options

- `version` - htmx version (read-only)
- `logAll` - Log all htmx events (default: `false`)
- `prefix` - Secondary attribute prefix recognised alongside `hx-` (default: `"data-hx-"`)
- `transitions` - Enable view transitions (default: `false`)
- `history` - Enable history support (default: `true`)
- `mode` - Request mode for fetch (default: `"same-origin"`)
- `defaultSwap` - Default swap style (default: `"innerHTML"`)
- `indicatorClass` - CSS class for indicators (default: `"htmx-indicator"`)
- `requestClass` - CSS class during requests (default: `"htmx-request"`)
- `includeIndicatorCSS` - Include default indicator CSS (default: `true`)
- `defaultTimeout` - Request timeout in ms (default: `60000`)
- `extensions` - Extensions to load (default: `""`)
- `morphPreserve` - CSS selector. Matching elements kept entirely (attrs + children) (default: `null`)
- `morphPreserveChildrenOf` - CSS selector. Matching elements: children kept, own attrs still change (default: `null`)
- `morphPreserveAttributes` - Attribute name patterns (`*` wildcard, `(a|b)` alternation). Matching names kept on any element, rest still changes (default: `null`)
- `noSwap` - HTTP status codes that skip swap (default: `[204, 304]`)
- `implicitInheritance` - Enable implicit attribute inheritance (default: `false`)

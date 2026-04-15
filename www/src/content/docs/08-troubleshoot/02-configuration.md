---
title: "Configuration"
description: "Configure htmx's global settings and options"
keywords: ["config", "settings", "options", "htmx.config", "meta tag"]
---

Htmx has configuration options that can be accessed either programmatically or declaratively.

They are listed below:

```html
<div class="info-table">

| Config Variable                   | Info                                                                                                                                                                                                                                                                       |
|-----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.logAll`              | defaults to `false`, if set to `true` htmx will log all events to the console for debugging                                                                                                                                                                                |
| `htmx.config.prefix`              | defaults to `"data-hx-"`, a secondary attribute prefix recognised alongside the always-active `hx-` prefix (e.g. `data-hx-get` works by default). Set to `""` to disable. **Must be set via meta tag** — setting this after page load will not apply correctly. |
| `htmx.config.transitions`         | defaults to `false`, whether to use view transitions when swapping content (if browser supports it)                                                                                                                                                                         |
| `htmx.config.history`             | defaults to `true`, whether to enable history support. Set to `"reload"` to do a full page reload on history navigation instead of an AJAX request                                                                                                                          |
| `htmx.config.mode`                | defaults to `'same-origin'`, the fetch mode for AJAX requests. Can be `'cors'`, `'no-cors'`, or `'same-origin'`                                                                                                                                                            |
| `htmx.config.defaultSwap`         | defaults to `innerHTML`                                                                                                                                                                                                                                                    |
| `htmx.config.indicatorClass`      | defaults to `htmx-indicator`                                                                                                                                                                                                                                               |
| `htmx.config.requestClass`        | defaults to `htmx-request`                                                                                                                                                                                                                                                 |
| `htmx.config.includeIndicatorCSS` | defaults to `true` (determines if the indicator styles are loaded)                                                                                                                                                                                                         |
| `htmx.config.defaultTimeout`      | defaults to `60000` (60 seconds), the number of milliseconds a request can take before automatically being terminated                                                                                                                                                      |
| `htmx.config.inlineScriptNonce`   | defaults to `''`, meaning that no nonce will be added to inline scripts                                                                                                                                                                                                    |
| `htmx.config.inlineStyleNonce`    | defaults to `''`, meaning that no nonce will be added to inline styles                                                                                                                                                                                                     |
| `htmx.config.extensions`          | defaults to `''`, a comma-separated list of extension names to load (e.g., `'preload,optimistic'`)                                                                                                                                                                         |
| `htmx.config.morphIgnore`         | defaults to `["data-htmx-powered"]`, array of attribute names to ignore when morphing elements                                                                                                                                                                             |
| `htmx.config.morphScanLimit`      | limits the number of nodes scanned during morphing                                                                                                                                                                                                                         |
| `htmx.config.morphSkip`           | CSS selector for elements to completely skip during morphing (they stay frozen)                                                                                                                                                                                             |
| `htmx.config.morphSkipChildren`   | CSS selector for elements whose attributes update but children are preserved during morphing                                                                                                                                                                                |
| `htmx.config.noSwap`              | defaults to `[204, 304]`, array of HTTP status codes that should not trigger a swap                                                                                                                                                                                        |
| `htmx.config.implicitInheritance` | defaults to `false`, if set to `true` attributes will be inherited from parent elements automatically without requiring the `:inherited` modifier                                                                                                                          |
| `htmx.config.defaultFocusScroll`  | defaults to `false`, whether to scroll focused elements into view after swap                                                                                                                                                                                                |
| `htmx.config.defaultSettleDelay`  | defaults to `1` (ms), delay between swap and settle phases                                                                                                                                                                                                                 |
| `htmx.config.metaCharacter`       | defaults to `undefined`, allows you to use a custom character instead of `:` for attribute modifiers (e.g., `-` to use `hx-get-inherited` instead of `hx-get:inherited`)                                                                                                   |

</div>

You can set most options directly in JavaScript, or you can use a `meta` tag:

> **Note:** Some options are read only once during initialisation and must be set via the `meta` tag to take effect. These include `prefix`, `extensions`, and `metaCharacter`.

<meta name="htmx-config" content='{"defaultSwap":"innerHTML"}'>
```

## Conclusion

And that's it!

Have fun with htmx!

You can accomplish [quite a bit](/patterns) without writing a lot of code!

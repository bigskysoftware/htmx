---
title: "HX-Location"
description: "Redirect without a full page load"
---

The `HX-Location` response header redirects without reloading the page.

## Syntax

Return a path:

```http
HX-Location: /dashboard
```

`HX-Location` calls `htmx.ajax()`. The header above is equivalent to:

```js
htmx.ajax('GET', '/dashboard', { push: 'true' })
```

Use any serializable [`htmx.ajax()` option](/reference/methods/htmx-ajax#options). Include `path`:

```text
# HCON
HX-Location: path:/search target:#results select:#matches

# JSON
HX-Location: {"path":"/search","target":"#results","select":"#matches"}
```

By default, indicators and disabled elements from the original request remain active until the redirected content replaces them. When targeting only part of the page, set `keepIndicators` to `false` to clean up the original request state:

```http
HX-Location: {"path":"/search","target":"#results","keepIndicators":false}
```

## Notes

`HX-Location` is not processed on 3xx responses. Return a 2xx response instead.

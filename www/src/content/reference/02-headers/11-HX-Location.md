---
title: "HX-Location"
description: "Redirect without a full page load"
---

The `HX-Location` response header redirects without reloading the page.

## Usage

Return a path:

```http
HX-Location: /dashboard
```

`HX-Location` calls `htmx.ajax()`. The header above is equivalent to:

```js
htmx.ajax('GET', '/dashboard', { push: 'true' })
```

Use any serializable [`htmx.ajax()` option](/reference/methods/htmx-ajax#context). Include `path`:

```text
# HCON
HX-Location: path:/search target:#results select:#matches

# JSON
HX-Location: {"path":"/search","target":"#results","select":"#matches"}
```

## Notes

`HX-Location` is not processed on 3xx responses. Return a 2xx response instead.

---
title: "htmx.config.mode"
description: "Set request mode for fetch API"
---

The `htmx.config.mode` option sets the `mode` option for fetch requests.

This is the **only** way to set the fetch mode — the `mode` key in per-element `hx-config`
attributes is ignored and always reset to this global value. This prevents injected markup
from widening request scope (e.g. switching from `same-origin` to `cors`).

**Default:** `"same-origin"`

## Valid Values

- `"same-origin"` - Only allow same-origin requests (default, most secure)
- `"cors"` - Allow cross-origin requests
- `"no-cors"` - Limited cross-origin requests
- `"navigate"` - Navigation mode

## Example

```javascript
htmx.config.mode = "cors";
```

```html
<meta name="htmx-config" content='{"mode":"cors"}'>
```

## Security

The default `"same-origin"` means the browser will reject any cross-origin fetch outright,
even if an attacker injects an `hx-get` pointing to an external URL.

If your app legitimately needs CORS (e.g. an API on a different subdomain), set `mode` globally
and pair it with a `Content-Security-Policy` `connect-src` directive to limit reachable origins:

```html
<meta http-equiv="Content-Security-Policy"
      content="connect-src 'self' https://api.example.com">
```

This way, even if an attacker injects a target URL, CSP blocks connections to origins you
haven't explicitly allowed.

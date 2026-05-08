---
title: "htmx.config.logAll"
description: "Log all htmx events to console"
---

The `htmx.config.logAll` option, when set to `true`, causes htmx to surface event-level output via `console.log`.

**Default:** `false`

Errors and warnings always flow to `console.error` / `console.warn` regardless of this flag. `logAll` controls only the chatty event-by-event output that's useful when debugging behavior. Most of the time you don't need it.

## Example

```javascript
htmx.config.logAll = true;
```

```html
<meta name="htmx-config" content='{"logAll":true}'>
```

Observability tools (Sentry, DataDog RUM, LogRocket, etc.) capture `console.*` automatically, so htmx logs flow into your existing pipeline without any extra setup.

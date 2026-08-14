---
title: "htmx.config.extensions"
description: "Restricts extension registration by name"
---

The `htmx.config.extensions` option restricts extension registration to listed names.

```html
<meta name="htmx-config" content='extensions:"preload,hx-pending"'>
<script src="/htmx.js"></script>
<script src="/hx-preload.js"></script>
<script src="/hx-pending.js"></script>
```

Both extension scripts still need to be loaded. The config only controls whether their calls to [`htmx.registerExtension()`](/reference/methods/htmx-registerExtension) succeed.

## Default

```text
""
```

An empty string allows every loaded extension to register.

## Extension Names

List names passed to `htmx.registerExtension()`, separated by commas:

```javascript
htmx.registerExtension('preload', { /* ... */ })
htmx.registerExtension('hx-pending', { /* ... */ })
```

## Configure Before Loading htmx

htmx reads the extension allowlist during initialization. Put the `htmx-config` meta element before the htmx script.

Changing `htmx.config.extensions` afterward does not change the active allowlist.

## See Also

- [`htmx.registerExtension()`](/reference/methods/htmx-registerExtension)
- [Extensions](/extensions)

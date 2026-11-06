---
title: "htmx.config.metaCharacter"
description: "Replaces `:` in attribute modifiers and event names"
---

The `htmx.config.metaCharacter` option allows you to replace the `:` character used in attribute modifiers (e.g., `hx-get:inherited`) with a custom character of your choice. It also replaces `:` in the names of dispatched events (e.g. with `-`, `htmx:after:settle` becomes `htmx-after-settle`), so listeners and `hx-on` attributes must use the adjusted names.

**Default:** `undefined` (uses `:`)

## Example

```javascript
htmx.config.metaCharacter = "-";
```

```html
<meta name="htmx-config" content='{"metaCharacter":"-"}'>
```

With the above setting, you would write `hx-get-inherited` instead of `hx-get:inherited`. This can help avoid conflicts with templating engines or parsers that treat `:` specially.

See also: [`htmx.config`](/reference/config/htmx-config)

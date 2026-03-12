---
title: "htmx.config.metaCharacter"
description: "Custom character used instead of `:` for attribute modifiers"
---

Allows you to replace the `:` character used in attribute modifiers (e.g., `hx-get:inherited`) with a custom character of your choice.

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

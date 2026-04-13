---
title: "htmx.config.prefix"
description: "Set a custom attribute prefix"
---

The `htmx.config.prefix` option allows you to use a custom prefix for htmx attributes instead of `hx-`.

Multiple prefixes can be specified as a comma-separated list, allowing htmx to recognise attributes under any of the given prefixes simultaneously.

**Default:** `""` (no prefix, use `hx-`)

## Examples

### Single custom prefix

```javascript
htmx.config.prefix = "data-hx-";
```

```html
<meta name="htmx-config" content='{"prefix":"data-hx-"}'>
```

Now you can use `data-hx-get` instead of [`hx-get`](/reference/attributes/hx-get), etc.

### Multiple prefixes

```javascript
htmx.config.prefix = "hx-,data-hx-";
```

```html
<meta name="htmx-config" content='{"prefix":"hx-,data-hx-"}'>
```

With multiple prefixes, both `hx-get` and `data-hx-get` are recognised. When an element has both, the first matching prefix wins.

This is useful for gradual migration or for environments that require `data-` prefixed attributes for HTML validity.

## Important: Set via meta tag

The prefix is read once during htmx initialisation. Setting it via JavaScript after the page has loaded may not apply correctly, as elements will already have been processed with the previous prefix.

Always configure the prefix using the meta tag:

```html
<meta name="htmx-config" content='{"prefix":"data-hx-"}'>
```

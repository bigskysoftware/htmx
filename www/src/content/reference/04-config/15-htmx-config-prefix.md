---
title: "htmx.config.prefix"
description: "Set a secondary attribute prefix"
---

The `htmx.config.prefix` option sets a secondary attribute prefix that htmx recognises in addition to the primary `hx-` prefix, which always works regardless of this setting.

**Default:** `"data-hx-"`

This means `data-hx-get`, `data-hx-target`, etc. work out of the box alongside `hx-get`, `hx-target`, etc. — matching the htmx 2 dual-attribute behaviour.

When both prefixes are present on the same element, `hx-` wins.

## Disable the secondary prefix

```html
<meta name="htmx-config" content='{"prefix":""}'>
```

## Use a custom secondary prefix

```html
<meta name="htmx-config" content='{"prefix":"data-boost-"}'>
```

Now both `hx-get` and `data-boost-get` are recognised.

## Important: Set via meta tag

The prefix is read once during htmx initialisation. Setting it via JavaScript after the page has loaded will not apply correctly, as elements will already have been processed.

Always configure the prefix using the meta tag:

```html
<meta name="htmx-config" content='{"prefix":"data-hx-"}'>
```

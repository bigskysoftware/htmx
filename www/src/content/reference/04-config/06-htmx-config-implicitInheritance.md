---
title: "htmx.config.implicitInheritance"
description: "Enables implicit attribute inheritance"
---

The `htmx.config.implicitInheritance` option, when set to `true`, causes child elements to implicitly inherit htmx attributes from parent elements.

**Default:** `false`

## Example

```javascript
htmx.config.implicitInheritance = true;
```

```html
<meta name="htmx-config" content='{"implicitInheritance":true}'>
```

When enabled, attributes like [`hx-target`](/reference/attributes/hx-target) on a parent apply to all child elements unless overridden.

This matches htmx 2 inheritance: request verbs (`hx-get`, `hx-post`, `hx-put`, `hx-patch`, `hx-delete`, `hx-query`), plus `hx-action`, `hx-method` and `hx-trigger`, are **not** inherited. Those still require the `:inherited` modifier if a parent value should apply to children. Without that exception, a container such as `hx-get="/panel" hx-trigger="load"` would pass both attributes to a nested `hx-post` form and reload the panel in a loop.

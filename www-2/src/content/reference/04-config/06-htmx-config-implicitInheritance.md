---
title: "htmx.config.implicitInheritance"
description: "Enable implicit attribute inheritance"
---

When set to `true`, child elements implicitly inherit htmx attributes from parent elements.

**Default:** `false`

## Example

```javascript
htmx.config.implicitInheritance = true;
```

```html
<meta name="htmx-config" content='{"implicitInheritance":true}'>
```

When enabled, attributes like `hx-target` on a parent apply to all child elements unless overridden.

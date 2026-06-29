---
title: "htmx.config.morphSkipChildren"
description: "Skip morphing children of specific elements"
---

The `htmx.config.morphSkipChildren` option is a CSS selector for elements whose children won't be morphed.

The element itself updates (attributes change). Its children stay untouched.

**Default:** `'[hx-morph-skip-children]'`

Add `hx-morph-skip-children` to any element in your server templates to freeze its children during morph while still allowing its own attributes to update:

```html
<lit-component hx-morph-skip-children value="{{value}}">...</lit-component>
```

Or override with any CSS selector:

```javascript
htmx.config.morphSkipChildren = "my-component";
```

## Use Cases

**Custom web components:**
Update component attributes but preserve managed children.

**Client-managed DOM:**
Let JavaScript frameworks control their own DOM trees.

**Multiple components:**
```javascript
htmx.config.morphSkipChildren = "my-component, other-component, .skip-kids";
```

## Difference from morphSkip

- **`morphSkip`:** Freezes entire element (no changes at all)
- **`morphSkipChildren`:** Updates element attributes, freezes children only

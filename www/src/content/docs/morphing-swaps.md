---
title: "Morphing Swaps"
description: "Morph swaps and how to exclude elements from them."
---

##### Excluding Elements from Morphing

Add `hx-morph-skip` or `hx-morph-skip-children` to elements in your server templates:

- `hx-morph-skip` - completely skip morphing specific elements (attrs + children stay frozen)
- `hx-morph-skip-children` - update element attributes but preserve children

Or configure globally with CSS selectors:

```javascript
htmx.config.morphSkip         = 'custom-widget, .frozen';
htmx.config.morphSkipChildren = 'lit-component, .sortable';
```

Useful for third-party widgets, custom web components, or active animations.

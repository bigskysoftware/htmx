---
title: "htmx.config.morphSkip"
description: "Skip morphing for specific elements"
---

The `htmx.config.morphSkip` option is a CSS selector for elements to skip during morphing.

Matching elements won't be morphed. They stay exactly as they are.

**Default:** `'[hx-morph-skip]'`

Add `hx-morph-skip` to any element in your server templates to freeze it entirely during morph:

```html
<custom-widget hx-morph-skip>...</custom-widget>
```

Or override with any CSS selector:

```javascript
htmx.config.morphSkip = ".no-morph";
```

## Use Cases

**Third-party widgets:**
Preserve complex widgets that manage their own state.

**Active animations:**
Skip elements with ongoing CSS or JavaScript animations.

**Client-side state:**
Protect elements with complex state that would be lost.

**Multiple selectors:**
```javascript
htmx.config.morphSkip = ".widget, .animated, custom-element";
```

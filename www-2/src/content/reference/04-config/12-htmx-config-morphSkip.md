---
title: "htmx.config.morphSkip"
description: "Skip morphing for specific elements"
---

# **`htmx.config.morphSkip`**

CSS selector for elements to skip during morphing.

Matching elements won't be morphed. They stay exactly as they are.

**Default:** `undefined`

## Example

```javascript
htmx.config.morphSkip = ".no-morph";
```

```html
<meta name="htmx-config" content='{"morphSkip":".no-morph"}'>
```

## Usage

```html
<body hx-swap:inherited="innerMorph">
  <div class="no-morph">
    <!-- Never morphed. Stays frozen. -->
  </div>
  <div>
    <!-- Morphed normally -->
  </div>
</body>
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

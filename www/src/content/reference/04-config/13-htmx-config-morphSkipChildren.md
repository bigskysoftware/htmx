---
title: "htmx.config.morphSkipChildren"
description: "Skip morphing children of specific elements"
---

The `htmx.config.morphSkipChildren` option is a CSS selector for elements whose children won't be morphed.

The element itself updates (attributes change). Its children stay untouched.

**Default:** `undefined`

## Example

```javascript
htmx.config.morphSkipChildren = "my-component";
```

```html
<meta name="htmx-config" content='{"morphSkipChildren":"my-component"}'>
```

## Usage

```html
<body hx-swap:inherited="innerMorph">
  <my-component data-value="123">
    <!-- Element attributes update above -->
    <!-- Children below stay frozen -->
    <div class="internal">Preserved</div>
  </my-component>
</body>
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

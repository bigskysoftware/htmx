# Project Instructions

## Tailwind CSS Transitions

Never use `transition-all`. Always use `transition` instead, which transitions only the properties we need:

```css
/* GOOD - use this */
transition
transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events;

/* BAD - never use this */
transition-all
transition-property: all;
```

Do not manually set transition duration (e.g., `duration-300`). The default duration (150ms) is sufficient for most cases.


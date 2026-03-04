---
title: "htmx:process:{type}"
description: "Custom template processing"
---

# **`htmx:process:{type}`**

Internal event fired when a `<template>` tag has a custom `type` attribute that needs processing.

## When It Fires

When htmx encounters a `<template>` element with a custom type attribute during processing.

## Event Detail

- `ctx` - Processing context
- `tasks` - Array of processing tasks

## Example

```html
<template type="custom-widget">
  <!-- Custom template content -->
</template>
```

```javascript
htmx.on('htmx:process:custom-widget', (evt) => {
  console.log('Processing custom template');
  // Handle custom template type
});
```

This allows extensions to define custom template processing logic.

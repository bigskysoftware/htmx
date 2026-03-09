---
title: "Multi-Target Updates"
description: "Update multiple elements from a single response"
---

## The Problem

htmx requests normally update one target element. Sometimes you need to update multiple parts of the page at once.

For example: After submitting a form, you want to update both the form itself and a notification counter.

## The Solution

htmx provides two ways to update multiple targets from a single response:

1. **Out-of-Band Swaps** - Match elements by their `id` attribute
2. **Partial Tags** - Explicitly specify where content goes

Choose the method that fits your needs.

## Out-of-Band Swaps

Use out-of-band swaps when you want to match elements by their `id`.

Add `hx-swap-oob="true"` to any element in your response. htmx will find the element with the same `id` in your page and swap it.

**Server response:**

```html
<div id="message" hx-swap-oob="true">
    Form submitted successfully!
</div>

<form id="my-form">
    <!-- Updated form content -->
</form>
```

**Result:**
- The `div#message` updates wherever it exists in your page
- The form updates in its normal target location

### Customize the Swap

Specify a different swap style:

```html
<div id="notifications" hx-swap-oob="beforeend">
    <span>New notification</span>
</div>
```

This appends the content to `div#notifications` instead of replacing it.

### Target a Different Element

Override the `id` matching by specifying a custom target:

```html
<div hx-swap-oob="innerHTML:#status">
    Processing...
</div>
```

This swaps the content into the element matching `#status`, regardless of the element's own `id`.

### When to Use Out-of-Band Swaps

Use out-of-band swaps when:
- Elements have consistent, unique `id` attributes
- You want simple, ID-based updates
- You're updating notification areas, counters, or status indicators

## Partial Tags

Use partial tags when you need explicit control over targeting.

Wrap content in a `<template>` tag with `type="partial"`. Specify where it goes with `hx-target`.

**Server response:**

```html
<template hx type="partial" hx-target="#messages" hx-swap="beforeend">
    <div class="message">New message content</div>
</template>

<template hx type="partial" hx-target="#notifications">
    <span class="badge">5</span>
</template>

<form id="my-form">
    <!-- Main form content -->
</form>
```

**Result:**
- First template's content appends to `#messages`
- Second template's content replaces contents of `#notifications`
- Form updates in its normal target location

### Attributes

Each `<template>` tag accepts:

- `type="partial"` - Required. Identifies this as a partial
- `hx-target` - Required. CSS selector for where to place content
- `hx-swap` - Optional. Swap style (defaults to `innerHTML`)

### When to Use Partials

Use partial tags when:
- Elements don't have `id` attributes
- You need to target by class or other selectors
- You want explicit control over what goes where
- You're building more complex update patterns

## Choosing Between Them

Both methods work together. Use them in the same response if needed.

**Use out-of-band swaps** for simple ID-based updates.

**Use partial tags** for everything else.

## Additional Features

### Select Specific Elements for OOB

Use `hx-select-oob` on the triggering element to extract specific elements from the response for out-of-band swapping:

```html
<button hx-post="/submit"
        hx-target="#form"
        hx-select-oob="#message, #counter">
    Submit
</button>
```

This pulls `#message` and `#counter` from the response and swaps them out-of-band, even if they don't have `hx-swap-oob` attributes.

### Preserve Content During Swaps

Add `hx-preserve="true"` to elements you want to keep across swaps:

```html
<video id="my-video" hx-preserve="true">
    <source src="video.mp4">
</video>
```

This keeps the video playing even when the parent container gets updated.

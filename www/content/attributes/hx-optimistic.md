+++
title = "hx-optimistic"
+++

**Note:** This is an extension attribute. To use it, you must include the optimistic extension found at `ext/hx-optimistic.js`.

The `hx-optimistic` attribute allows you to show optimistic content immediately while a request is in flight, providing instant user feedback before the server responds.

## Installation

Load the extension in your htmx configuration:

```javascript
htmx.config.extensions = 'optimistic';
```

Or load the extension file directly (if available as a separate extension).

## Basic Usage

The attribute takes a CSS selector that points to the optimistic content to swap in:

```html
<div hx-post="/like" hx-optimistic="#liked-state">
    <div id="unliked-state">♡ Like</div>
</div>

<template id="liked-state">
    <div>♥ Liked!</div>
</template>
```

## How It Works

1. When the request is triggered, htmx immediately swaps in the optimistic content
2. The original content is saved
3. When the server responds, the response content replaces the optimistic content
4. If the request fails, the original content is restored

## Notes

* Optimistic content is swapped in immediately when the request is triggered
* If the request fails, the optimistic content is rolled back to the original
* Useful for providing immediate feedback to users
* Can use `<template>` tags or any hidden element as the source of optimistic content

## See Also

* [Extensions](@/docs.md#extensions)

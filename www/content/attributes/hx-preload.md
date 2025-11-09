+++
title = "hx-preload"
+++

**Note:** This is an extension attribute. To use it, you must include the preload extension.

The `hx-preload` attribute allows you to preload content before the user actually triggers the request, improving perceived performance.

## Installation

Load the extension in your htmx configuration:

```javascript
htmx.config.extensions = 'preload';
```

Or load the extension file directly (if available as a separate extension).

## Basic Usage

```html
<a href="/details" hx-get="/details" hx-preload="mouseenter">
    View Details
</a>
```

## Trigger Events

You can specify when to preload:

* `mouseenter` - preload when mouse enters the element
* `mouseover` - preload on mouseover
* `touchstart` - preload on touch start (for mobile)

```html
<button hx-get="/data" hx-preload="mouseenter">
    Load Data
</button>
```

## Notes

* Preloads content on the specified trigger event
* When the actual request is made, htmx uses the preloaded content if available
* Useful for improving perceived performance, especially on slower networks
* Cached preloaded responses are used when the actual request is triggered
* Falls back to normal request if preload hasn't completed

## See Also

* [Extensions](@/docs.md#extensions)

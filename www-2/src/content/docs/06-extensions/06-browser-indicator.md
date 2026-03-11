---
title: "Browser Indicator"
description: "Show the browser's native loading indicator during htmx requests"
keywords: ["browser", "indicator", "loading", "spinner", "tab"]
---

The `browser-indicator` extension shows the browser's native loading indicator (the tab spinner) during htmx requests. This gives users the same visual feedback they get during full-page navigations, without any custom CSS or HTML.

This extension requires the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API), which is available in Chromium-based browsers. In browsers that don't support it, the extension is a no-op.

## Installing

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-browser-indicator.js"></script>
```

## Usage

Add `hx-browser-indicator="true"` to elements whose requests should show the browser indicator:

```html
<button hx-get="/api/data" hx-browser-indicator="true">
    Load Data
</button>
```

While the request is in flight, the browser's tab spinner will be active just like a normal page load.

### Boosted Elements

Instead of marking individual elements, you can enable the indicator for all boosted links and forms via config:

```html
<meta name="htmx-config" content='{"extensions": "browser-indicator", "boostBrowserIndicator": true}'>
```

With this config, any element with `hx-boost` will automatically show the browser indicator during its requests.

### Browser Stop Button

If the user clicks the browser's stop button while a request is in flight, the extension will abort all active htmx requests that are showing the indicator.

## Notes

- Requires the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) (Chromium 105+). The extension does nothing in browsers that don't support it.
- As of this writing, Firefox supports the Navigation API but does not properly show a spinner.
- Multiple concurrent requests are handled: the indicator stays active until all tracked requests complete.

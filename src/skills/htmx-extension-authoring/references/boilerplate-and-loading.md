# Extension Boilerplate and Loading

## Extension Boilerplate

```javascript
(() => {
    let api;

    htmx.registerExtension('my-ext', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_after_init: (elt, detail) => {
            // Check for your custom attribute
            let value = api.attributeValue(elt, "hx-my-attr");
            if (!value) return;
            // Initialize behavior for this element
        },

        htmx_before_request: (elt, detail) => {
            // Modify request before sending
            // detail.ctx has request info
            // Return false to cancel
        },

        htmx_after_request: (elt, detail) => {
            // After request completes
            // detail.ctx.text has response text
            // detail.ctx.response has status, headers
        },

        htmx_before_swap: (elt, detail) => {
            // Before content swap
        },

        htmx_after_swap: (elt, detail) => {
            // After content swap
        },

        htmx_before_cleanup: (elt, detail) => {
            // Clean up event listeners, timers, etc.
        },
    });
})();
```

## Loading Extensions

Include the script after htmx.js. Optionally restrict which extensions can register:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/hx-my-ext.js"></script>
<meta name="htmx-config" content='{"extensions": "my-ext"}'>
```

When the `extensions` config is set, only listed extensions load. Without it, all registered extensions are active.

The whitelist matches the name passed to `registerExtension()`, not the file name. The shipped extensions are
not consistent about this: `hx-sse.js` registers as `sse`, `hx-preload.js` as `preload`, `htmx-2-compat.js` as
`compat`, but `hx-live.js` registers as `hx-live`. Pick one and document it for your own extension.

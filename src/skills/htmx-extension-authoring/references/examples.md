# Real Extension Patterns

## Real Extension Examples

### Pattern: Preload (init + per-element setup + request interception + cleanup)

From `src/ext/hx-preload.js` -- prefetches requests on trigger events:

```javascript
(() => {
    let api;

    htmx.registerExtension('preload', {
        init: (internalAPI) => { api = internalAPI; },

        htmx_after_init: (elt) => {
            // Check for hx-preload attribute
            let preloadSpec = api.attributeValue(elt, "hx-preload");
            if (!preloadSpec) return;

            let specs = api.parseTriggerSpecs(preloadSpec);
            let preloadListener = async (evt) => {
                let {method} = api.determineMethodAndAction(elt, evt);
                if (method !== 'GET') return;

                let ctx = api.createRequestContext(elt, evt);
                // ... prefetch logic, store in elt._htmx.preload
            };

            for (let spec of specs) {
                elt.addEventListener(spec.name, preloadListener);
            }
            elt._htmx.preloadListener = preloadListener;
        },

        htmx_before_request: (elt, detail) => {
            // Use cached prefetch if available and not expired
            if (elt._htmx?.preload) {
                detail.ctx.fetch = () => elt._htmx.preload.prefetch;
                delete elt._htmx.preload;
            }
        },

        htmx_before_cleanup: (elt) => {
            // Remove event listeners
            if (elt._htmx?.preloadListener) {
                for (let event of elt._htmx.preloadEvents) {
                    elt.removeEventListener(event, elt._htmx.preloadListener);
                }
            }
        },
    });
})();
```

Key patterns:
- Store API reference in closure
- Use `htmx_after_init` to set up per-element behavior
- Use `elt._htmx` to store per-element state
- Use `htmx_before_cleanup` to tear down listeners
- Use `detail.ctx.fetch` to override the fetch call

### Pattern: Pending UI (request/error/swap lifecycle)

From `src/ext/hx-pending.js` -- shows pending content during request:

```javascript
(() => {
    htmx.registerExtension('hx-pending', {
        htmx_before_request: (elt, detail) => {
            // Insert pending content before request fires
            insertPendingContent(detail.ctx);
        },
        htmx_error: (elt, detail) => {
            // Revert on error
            removePendingContent(detail.ctx);
        },
        htmx_before_swap: (elt, detail) => {
            // Remove pending content before real swap
            removePendingContent(detail.ctx);
        },
    });
})();
```

Key patterns:
- No `init` needed if you don't use the internal API
- Store state on `detail.ctx` (per-request, not per-element)
- Handle error case to revert pending changes
- Clean up before swap so real content replaces cleanly

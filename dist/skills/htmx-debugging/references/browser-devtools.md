# Browser DevTools Techniques

## Browser DevTools Techniques

### Network Tab
- Filter by Fetch/XHR requests
- Look for `HX-Request: true` in request headers to confirm htmx is making the request
- Check response headers for `HX-Trigger`, `HX-Retarget`, `HX-Reswap`
- Check response body -- should be HTML, not JSON

### Elements Panel
- Inspect element and check for `_htmx` property (indicates htmx processed it)
- Look for `htmx-request` class during active requests
- Look for `htmx-swapping` / `htmx-settling` classes during swaps

### Console
- `htmx.config.logAll = true` -- log every event (errors and warnings already on by default)
- `htmx.version` -- confirm which major version is loaded
- `htmx.find("#selector")` -- test extended CSS selectors
- `htmx.trigger(elt, "eventName")` -- manually fire events

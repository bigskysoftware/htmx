# Request Context

## Request Context (`detail.ctx`)

The context object available via `detail.ctx` in hook callbacks:

```javascript
{
    sourceElement,      // Element that triggered the request
    sourceEvent,        // The triggering DOM event
    status,             // Request status string
    target,             // Target element for swap
    swap,               // Swap strategy string
    select,             // hx-select value
    selectOOB,          // hx-select-oob value
    push,               // hx-push-url value
    replace,            // hx-replace-url value
    transition,         // Whether view transitions enabled
    request: {
        action,         // Request URL
        method,         // HTTP method (GET, POST, etc.)
        headers,        // Request headers object
        body,           // FormData during htmx_config_request; final BodyInit later
        validate,       // Whether to validate form
        abort,          // Function to abort request
        signal,         // AbortSignal
        timeout,        // Timeout in ms
        credentials,    // Fetch credentials mode
        mode,           // Fetch mode
    },
    response: {         // Available after request completes
        raw,            // Raw Response object
        status,         // HTTP status code
        headers,        // Response headers
    },
    text,               // Response text (after request)
    hx,                 // Parsed HX-* response headers
}
```

**Modifying the request:** Change `detail.ctx.request` properties in `htmx_config_request` or `htmx_before_request`.

**Modifying the response:** Change `detail.ctx.text` in `htmx_after_request` (before swap).

**Overriding fetch:** Set `detail.ctx.fetch` to a function returning a Response or Promise<Response>.

+++
title = "Building htmx Extensions"
+++

htmx 4 introduces a new extension system based on event hooks rather than the
old callback-based API.

## Migrating from htmx 2.x

If you're migrating an extension from htmx 2.x, here's a quick reference:

| htmx 2.x                              | htmx 4                | Migration Notes                                                                        |
| ------------------------------------- | --------------------- | -------------------------------------------------------------------------------------- |
| `init(api)`                           | `init(api)`           | Same name, store API reference for other hooks                                         |
| `getSelectors()`                      | `htmx_after_init`     | Check `api.attributeValue(elt, "attr")` instead of returning selectors.                |
| `onEvent(name, evt)`                  | Specific hooks        | Replace with `htmx_before_request`, `htmx_after_swap`, etc. (use underscores)          |
| `transformResponse(text, xhr, elt)`   | `htmx_after_request`  | Modify `detail.ctx.text` directly (check if exists first as not set for SSE responses) |
| `isInlineSwap(swapStyle)`             | Not needed            | Move logic into `htmx_handle_swap`. For OOB outer swaps, use `detail.unstripped`       |
| `handleSwap(style, target, fragment)` | `htmx_handle_swap`    | Access via `detail.swapSpec.style` and `detail.fragment`, return false                 |
| `encodeParameters(xhr, params, elt)`  | `htmx_config_request` | Modify `detail.ctx.request.body` (FormData) and headers directly                       |

For detailed migration examples, see the
[Extension Migration Guide](/extensions/migration-guide).

## Defining an Extension

Extensions are defined using `htmx.registerExtension()`:

```javascript
htmx.registerExtension("my-ext", {
    init: (internalAPI) => {
        // Called once when extension is registered
        // Store internalAPI reference if needed
    },

    htmx_before_request: (elt, detail) => {
        // Called before each request
        // Return false to cancel
    },

    htmx_after_request: (elt, detail) => {
        // Called after each request
    },
});
```

## Extension Approval

Extensions can be approved via the `extensions` config option in a meta tag:

```html
<meta name="htmx-config" content='{"extensions": "my-ext,another-ext"}'>
```

If this is set then only approved extensions will be loaded. This prevents
unauthorized extensions from running. By default without this config set in a
meta tag all extensions will be approved.

## Event Hooks

Extensions hook into htmx lifecycle events. Event names use underscores instead
of colons:

### Core Lifecycle Events

| Hook Name             | Triggered Event       | Parameters      | Description                   |
| --------------------- | --------------------- | --------------- | ----------------------------- |
| `htmx_before_init`    | `htmx:before:init`    | `(elt, detail)` | Before element initialization |
| `htmx_after_init`     | `htmx:after:init`     | `(elt, detail)` | After element initialization  |
| `htmx_before_process` | `htmx:before:process` | `(elt, detail)` | Before processing element     |
| `htmx_after_process`  | `htmx:after:process`  | `(elt, detail)` | After processing element      |
| `htmx_before_cleanup` | `htmx:before:cleanup` | `(elt, detail)` | Before cleaning up element    |
| `htmx_after_cleanup`  | `htmx:after:cleanup`  | `(elt, detail)` | After cleaning up element     |

### Request Lifecycle Events

| Hook Name              | Triggered Event        | Parameters      | Description                      |
| ---------------------- | ---------------------- | --------------- | -------------------------------- |
| `htmx_config_request`  | `htmx:config:request`  | `(elt, detail)` | Configure request before sending |
| `htmx_before_request`  | `htmx:before:request`  | `(elt, detail)` | Before request is sent           |
| `htmx_after_request`   | `htmx:after:request`   | `(elt, detail)` | After request completes          |
| `htmx_finally_request` | `htmx:finally:request` | `(elt, detail)` | Always called after request      |
| `htmx_error`           | `htmx:error`           | `(elt, detail)` | On request error                 |

### Swap Events

| Hook Name            | Triggered Event      | Parameters      | Description             |
| -------------------- | -------------------- | --------------- | ----------------------- |
| `htmx_before_swap`   | `htmx:before:swap`   | `(elt, detail)` | Before content swap     |
| `htmx_after_swap`    | `htmx:after:swap`    | `(elt, detail)` | After content swap      |
| `htmx_after_restore` | `htmx:after:restore` | `(elt, detail)` | After restoring content |
| `htmx_handle_swap`   | `htmx:handle:swap`   | `(elt, detail)` | Custom swap handler     |

### History Events

| Hook Name                         | Triggered Event                   | Parameters      | Description                   |
| --------------------------------- | --------------------------------- | --------------- | ----------------------------- |
| `htmx_before_history_update`      | `htmx:before:history:update`      | `(elt, detail)` | Before updating history       |
| `htmx_after_history_update`       | `htmx:after:history:update`       | `(elt, detail)` | After updating history        |
| `htmx_after_push_into_history`    | `htmx:after:push:into:history`    | `(elt, detail)` | After pushing to history      |
| `htmx_after_replace_into_history` | `htmx:after:replace:into:history` | `(elt, detail)` | After replacing history       |
| `htmx_before_restore_history`     | `htmx:before:restore:history`     | `(elt, detail)` | Before restoring from history |

### SSE Events

| Hook Name                   | Triggered Event             | Parameters      | Description                   |
| --------------------------- | --------------------------- | --------------- | ----------------------------- |
| `htmx_before_sse_reconnect` | `htmx:before:sse:reconnect` | `(elt, detail)` | Before SSE reconnection       |
| `htmx_before_sse_stream`    | `htmx:before:sse:stream`    | `(elt, detail)` | Before SSE stream starts      |
| `htmx_after_sse_stream`     | `htmx:after:sse:stream`     | `(elt, detail)` | After SSE stream ends         |
| `htmx_before_sse_message`   | `htmx:before:sse:message`   | `(elt, detail)` | Before processing SSE message |
| `htmx_after_sse_message`    | `htmx:after:sse:message`    | `(elt, detail)` | After processing SSE message  |

### View Transition Events

| Hook Name                    | Triggered Event              | Parameters      | Description            |
| ---------------------------- | ---------------------------- | --------------- | ---------------------- |
| `htmx_before_viewTransition` | `htmx:before:viewTransition` | `(elt, detail)` | Before view transition |
| `htmx_after_viewTransition`  | `htmx:after:viewTransition`  | `(elt, detail)` | After view transition  |

### Other Events

| Hook Name                        | Triggered Event                  | Parameters      | Description                          |
| -------------------------------- | -------------------------------- | --------------- | ------------------------------------ |
| `htmx_after_implicitInheritance` | `htmx:after:implicitInheritance` | `(elt, detail)` | After implicit attribute inheritance |

## Cancelling Events

Return `false` or set `detail.cancelled = true` to cancel an event:

```javascript
htmx.registerExtension("validator", {
    htmx_before_request: (elt, detail) => {
        if (!isValid(detail.ctx)) {
            return false; // Cancel request
        }
    },
});
```

## Internal API

The `init` hook receives an internal API object with helper methods:

```javascript
let api;

htmx.registerExtension("my-ext", {
    init: (internalAPI) => {
        api = internalAPI;
    },

    htmx_after_init: (elt) => {
        // Use internal API
        let value = api.attributeValue(elt, "hx-my-attr");
        let specs = api.parseTriggerSpecs("click, keyup delay:500ms");
        let { method, action } = api.determineMethodAndAction(elt, evt);
    },
});
```

Available internal API methods:

- `attributeValue(elt, name, defaultVal, returnElt)` - Get htmx attribute value
  with inheritance
- `parseTriggerSpecs(spec)` - Parse trigger specification string
- `determineMethodAndAction(elt, evt)` - Get HTTP method and URL
- `createRequestContext(elt, evt)` - Create request context object
- `collectFormData(elt, form, submitter)` - Collect form data
- `handleHxVals(elt, body)` - Process hx-vals attribute

## Request Context

The `detail.ctx` object contains request information:

```javascript
{
    sourceElement,      // Element triggering request
    sourceEvent,        // Event that triggered request
    status,            // Request status
    target,            // Target element for swap
    swap,              // Swap strategy
    request: {
        action,        // Request URL
        method,        // HTTP method
        headers,       // Request headers
        body,          // Request body (FormData)
        validate,      // Whether to validate
        abort,         // Function to abort request
        signal         // AbortSignal
    },
    response: {        // Available after request
        raw,           // Raw Response object
        status,        // HTTP status code
        headers        // Response headers
    },
    text,              // Response text (after request)
    hx                 // HX-* response headers (parsed)
}
```

## Custom Swap Strategies

Extensions can implement custom swap strategies:

```javascript
htmx.registerExtension("my-swap", {
    htmx_handle_swap: (target, detail) => {
        let { swapSpec, fragment } = detail;
        if (swapSpec.style === "my-custom-swap") {
            // Implement custom swap logic
            target.appendChild(fragment);
            return true; // Handled
        }
        return false; // Not handled
    },
});
```

## Complete Example

```javascript
(() => {
    let api;

    htmx.registerExtension("preload", {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_after_init: (elt) => {
            let preloadSpec = api.attributeValue(elt, "hx-preload");
            if (!preloadSpec) return;

            let specs = api.parseTriggerSpecs(preloadSpec);
            let eventName = specs[0].name;

            elt.addEventListener(eventName, async (evt) => {
                let ctx = api.createRequestContext(elt, evt);
                // Prefetch logic here
            });
        },

        htmx_before_request: (elt, detail) => {
            // Use prefetched response if available
            if (elt._htmx?.preload) {
                detail.ctx.fetch = () => elt._htmx.preload;
                delete elt._htmx.preload;
            }
        },

        htmx_before_cleanup: (elt) => {
            // Clean up listeners
            if (elt._htmx?.preloadListener) {
                elt.removeEventListener(
                    elt._htmx.preloadEvent,
                    elt._htmx.preloadListener,
                );
            }
        },
    });
})();
```

## Migration from htmx 2.x

The htmx 4 extension API is completely different from htmx 2.x:

**Old API (htmx 2.x):**

```javascript
htmx.defineExtension("old", {  // Note: htmx 2.x used defineExtension with different format
    onEvent: function (name, evt) {},
    transformResponse: function (text, xhr, elt) {},
    handleSwap: function (swapStyle, target, fragment, settleInfo) {},
});
```

**New API (htmx 4):**

```javascript
htmx.registerExtension("new", {
    htmx_before_request: (elt, detail) => {},
    htmx_after_request: (elt, detail) => {},
    htmx_handle_swap: (elt, detail) => {},
});
```

Key differences:

- Event-based hooks instead of method callbacks
- Underscores in hook names (not colons)
- Extensions must be approved via config
- Access to full request context via `detail.ctx`
- Internal API provided via `init` hook

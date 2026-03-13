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
| `isInlineSwap(swapStyle)`             | Not needed            | Move logic into `handle_swap`. For OOB outer swaps, use `detail.unstripped`            |
| `handleSwap(style, target, fragment)` | `handle_swap`         | Args are `(swapStyle, target, fragment, swapSpec)`, return truthy if handled            |
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

## Loading Extensions

Extensions are loaded by including the script file. They apply page-wide automatically.

To restrict which extensions can register, use the `extensions` config as a whitelist:

```html
<meta name="htmx-config" content='{"extensions": "my-ext,another-ext"}'>
```

When this config is set, only the listed extensions will be loaded. Without it, all registered
extensions are active.

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
| `htmx_before_response` | `htmx:before:response` | `(elt, detail)` | After fetch, before body consumed |
| `htmx_after_request`   | `htmx:after:request`   | `(elt, detail)` | After request completes          |
| `htmx_finally_request` | `htmx:finally:request` | `(elt, detail)` | Always called after request      |
| `htmx_error`           | `htmx:error`           | `(elt, detail)` | On request error                 |

### Swap Events

| Hook Name             | Triggered Event       | Parameters      | Description             |
| --------------------- | --------------------- | --------------- | ----------------------- |
| `htmx_before_swap`    | `htmx:before:swap`    | `(elt, detail)` | Before content swap     |
| `htmx_after_swap`     | `htmx:after:swap`     | `(elt, detail)` | After content swap      |
| `htmx_before_settle`  | `htmx:before:settle`  | `(elt, detail)` | Before settle phase     |
| `htmx_after_settle`   | `htmx:after:settle`   | `(elt, detail)` | After settle phase      |
| `handle_swap`         | _(direct call)_       | `(swapStyle, target, fragment, swapSpec)` | Custom swap handler     |

### Morph Events

| Hook Name                  | Triggered Event            | Parameters      | Description                                         |
| -------------------------- | -------------------------- | --------------- | --------------------------------------------------- |
| `htmx_before_morph_node`   | `htmx:before:morph:node`   | `(elt, detail)` | Before morphing a node — return `false` to skip it  |

`detail` contains `oldNode` (the existing DOM node) and `newNode` (the incoming node it will be morphed into).

### History Events

| Hook Name                         | Triggered Event                   | Parameters      | Description                   |
| --------------------------------- | --------------------------------- | --------------- | ----------------------------- |
| `htmx_before_history_update`      | `htmx:before:history:update`      | `(elt, detail)` | Before updating history       |
| `htmx_after_history_update`       | `htmx:after:history:update`       | `(elt, detail)` | After updating history        |
| `htmx_after_push_into_history`    | `htmx:after:push:into:history`    | `(elt, detail)` | After pushing to history      |
| `htmx_after_replace_into_history` | `htmx:after:replace:into:history` | `(elt, detail)` | After replacing history       |
| `htmx_before_restore_history`     | `htmx:before:restore:history`     | `(elt, detail)` | Before restoring from history |

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
- `htmxProp(elt)` - Ensure element has `_htmx` internal data and `data-htmx-powered` attribute, returns `_htmx` object

## Request Context

The `detail.ctx` object is available in all request lifecycle event hooks. It is created before the
request and populated progressively as the request proceeds.

```javascript
{
    // --- Available from creation ---
    sourceElement,      // Element that triggered the request
    sourceEvent,        // DOM event that triggered the request
    status,             // Lifecycle status: "created" → "queued"/"dropped" → "issuing" → "response received" → "swapped" or "error: ..."
    target,             // Resolved target element for swap
    swap,               // Swap strategy string (e.g. "innerHTML", "outerMorph")
    select,             // CSS selector for content selection (from hx-select)
    selectOOB,          // CSS selector for OOB swaps (from hx-select-oob)
    push,               // URL to push into history (from hx-push-url)
    replace,            // URL to replace in history (from hx-replace-url)
    transition,         // Whether to use view transitions (from config.transitions)
    confirm,            // Confirmation message (from hx-confirm)
    fetch,              // Fetch function — defaults to window.fetch, overridable (see below)
    request: {
        action,         // Request URL (without fragment)
        anchor,         // Fragment identifier (part after #)
        method,         // HTTP method (GET, POST, etc.)
        headers,        // Request headers object
        body,           // Request body: FormData, URLSearchParams, or null
        validate,       // Whether to run form validation
        abort,          // Function — call to abort the request
        signal,         // AbortSignal passed to fetch()
        credentials,    // Fetch credentials ("same-origin" by default)
        mode,           // Fetch mode (from config.mode, "same-origin" by default)
        form,           // Enclosing form element, if any (set during form data collection)
        submitter,      // Submit button that triggered the request, if any
    },

    // --- Available after response ---
    response: {
        raw,            // Raw Response object
        status,         // HTTP status code (number)
        headers,        // Response headers object
    },
    text,               // Response body as text
    title,              // Page title extracted from response
    hx: {               // Parsed HX-* response headers
        retarget,       // HX-Retarget value
        reswap,         // HX-Reswap value
        reselect,       // HX-Reselect value
        trigger,        // HX-Trigger value
        refresh,        // HX-Refresh value
        redirect,       // HX-Redirect value
        pushUrl,        // HX-Push-Url value
        replaceUrl,     // HX-Replace-Url value
        location,       // HX-Location value
    },
}
```

### Overriding `ctx.fetch`

A very powerful option that htmx 4 makes available is that you can replace `ctx.fetch` during the 
`htmx:config:request` event in order to customize how requests are made and handled. 

Here is a simple example that logs the request interception and then delegates to the built
in version of `fetch`:

```javascript
htmx.on("htmx:config:request", (evt) => {
    let ctx = evt.detail.ctx;
    let originalFetch = ctx.fetch;
    ctx.fetch = async (url, options) => {
        console.log("Intercepted request to", url);
        return originalFetch(url, options);
    };
});
```

With this functionality you can add "middleware" to the htmx request life cycle.

See the `hx-preload` extension for a good example of this feature.

## Custom Swap Strategies

Extensions can implement custom swap strategies:

```javascript
htmx.registerExtension("my-swap", {
    handle_swap: (swapStyle, target, fragment, swapSpec) => {
        if (swapStyle === "my-custom-swap") {
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
    handle_swap: (swapStyle, target, fragment, swapSpec) => {},
});
```

Key differences:

- Event-based hooks instead of method callbacks
- Underscores in hook names (not colons)
- Extensions load by including the script (config whitelist is optional)
- Access to full request context via `detail.ctx`
- Internal API provided via `init` hook

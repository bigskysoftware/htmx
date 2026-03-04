---
name: htmx-extension-authoring
description: Use when creating, modifying, or debugging htmx 4 extensions. Covers the event-based extension API, internal API, lifecycle hooks, and distribution patterns.
argument-hint: "[description of extension behavior]"
---

# Building htmx 4 Extensions

htmx 4 extensions hook into lifecycle events via `htmx.registerExtension()`.
Extensions are global -- they apply page-wide, activated by custom attributes where needed.

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

## Event Hooks Reference

Hook names use underscores (not colons). All hooks receive `(elt, detail)` unless noted.

### Core Lifecycle

| Hook | Event | Description |
|------|-------|-------------|
| `htmx_before_init` | `htmx:before:init` | Before element initialization |
| `htmx_after_init` | `htmx:after:init` | After element initialization |
| `htmx_before_process` | `htmx:before:process` | Before processing element |
| `htmx_after_process` | `htmx:after:process` | After processing element |
| `htmx_before_cleanup` | `htmx:before:cleanup` | Before cleaning up element |
| `htmx_after_cleanup` | `htmx:after:cleanup` | After cleaning up element |

### Request Lifecycle

| Hook | Event | Description |
|------|-------|-------------|
| `htmx_config_request` | `htmx:config:request` | Configure request (modify headers, body, URL) |
| `htmx_before_request` | `htmx:before:request` | Before request is sent |
| `htmx_before_response` | `htmx:before:response` | After fetch response, before body consumed |
| `htmx_after_request` | `htmx:after:request` | After request completes |
| `htmx_finally_request` | `htmx:finally:request` | Always fires after request (like `finally`) |
| `htmx_error` | `htmx:error` | On any error |

### Swap

| Hook | Event | Description |
|------|-------|-------------|
| `htmx_before_swap` | `htmx:before:swap` | Before content swap |
| `htmx_after_swap` | `htmx:after:swap` | After content swap |
| `htmx_before_settle` | `htmx:before:settle` | Before settle phase |
| `htmx_after_settle` | `htmx:after:settle` | After settle phase |
| `handle_swap` | _(direct call)_ | Custom swap handler. Signature: `(swapStyle, target, fragment, swapSpec)`. Return truthy if handled. |

### History

| Hook | Event |
|------|-------|
| `htmx_before_history_update` | `htmx:before:history:update` |
| `htmx_after_history_update` | `htmx:after:history:update` |
| `htmx_after_push_into_history` | `htmx:after:push:into:history` |
| `htmx_after_replace_into_history` | `htmx:after:replace:into:history` |
| `htmx_before_restore_history` | `htmx:before:restore:history` |

### View Transitions

| Hook | Event |
|------|-------|
| `htmx_before_viewTransition` | `htmx:before:viewTransition` |
| `htmx_after_viewTransition` | `htmx:after:viewTransition` |

### Other

| Hook | Event |
|------|-------|
| `htmx_after_implicitInheritance` | `htmx:after:implicitInheritance` |

## Cancelling Events

Return `false` or set `detail.cancelled = true`:

```javascript
htmx_before_request: (elt, detail) => {
    if (!isValid(detail.ctx)) {
        return false; // Cancel the request
    }
},
```

## Internal API

The `init` hook receives an internal API object. Store it in a closure variable:

```javascript
let api;
init: (internalAPI) => { api = internalAPI; },
```

**Available methods:**

| Method | Description |
|--------|-------------|
| `api.attributeValue(elt, name, defaultVal, returnElt)` | Get attribute value with inheritance support |
| `api.parseTriggerSpecs(spec)` | Parse trigger spec string into array of spec objects |
| `api.determineMethodAndAction(elt, evt)` | Get `{method, action}` for an element |
| `api.createRequestContext(elt, evt)` | Create a full request context object |
| `api.collectFormData(elt, form, submitter)` | Collect form data as FormData |
| `api.handleHxVals(elt, body)` | Process `hx-vals` attribute into body |

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
        body,           // Request body (FormData)
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

## Custom Swap Strategies

```javascript
handle_swap: (swapStyle, target, fragment, swapSpec) => {
    if (swapStyle === "my-custom-swap") {
        // fragment is a DocumentFragment with the response content
        target.replaceChildren(fragment);
        return true; // Signal that this swap was handled
    }
    return false; // Not our swap style, let htmx handle it
},
```

Usage in HTML:
```html
<div hx-get="/data" hx-swap="my-custom-swap">Load</div>
```

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

### Pattern: Optimistic UI (request/error/swap lifecycle)

From `src/ext/hx-optimistic.js` -- shows optimistic content during request:

```javascript
(() => {
    htmx.registerExtension('hx-optimistic', {
        htmx_before_request: (elt, detail) => {
            // Insert optimistic content before request fires
            insertOptimisticContent(detail.ctx);
        },
        htmx_error: (elt, detail) => {
            // Revert on error
            removeOptimisticContent(detail.ctx);
        },
        htmx_before_swap: (elt, detail) => {
            // Remove optimistic content before real swap
            removeOptimisticContent(detail.ctx);
        },
    });
})();
```

Key patterns:
- No `init` needed if you don't use the internal API
- Store state on `detail.ctx` (per-request, not per-element)
- Handle error case to revert optimistic changes
- Clean up before swap so real content replaces cleanly

## Migrating from htmx 2.x Extensions

| htmx 2.x | htmx 4 | Notes |
|-----------|---------|-------|
| `htmx.defineExtension()` | `htmx.registerExtension()` | Different function name |
| `onEvent(name, evt)` | Specific hooks (`htmx_before_request`, etc.) | Use underscored hook names |
| `transformResponse(text, xhr, elt)` | `htmx_after_request` | Modify `detail.ctx.text` |
| `handleSwap(style, target, fragment)` | `handle_swap(style, target, fragment, swapSpec)` | Extra `swapSpec` param, return truthy |
| `encodeParameters(xhr, params, elt)` | `htmx_config_request` | Modify `detail.ctx.request.body` and `.headers` |
| `getSelectors()` | `htmx_after_init` | Check `api.attributeValue(elt, "attr")` instead |
| `isInlineSwap(swapStyle)` | Not needed | Move logic into `handle_swap` |

## Distribution Conventions

- **File naming:** `hx-{name}.js` (matches `src/ext/` convention)
- **Wrap in IIFE:** `(() => { ... })()` to avoid polluting global scope
- **Self-contained:** Extension file includes everything it needs
- **Load order:** Include after htmx.js, before any HTML that uses it
- **Naming:** Extension name should be lowercase, use hyphens (e.g. `my-extension`)

## Instructions for Claude

When writing htmx 4 extensions:

1. **Always wrap in an IIFE** -- `(() => { ... })()`
2. **Store the `api` reference** from `init` in a closure variable
3. **Check `api.attributeValue()` result** before acting -- return early if no custom attribute
4. **Clean up in `htmx_before_cleanup`** -- remove event listeners, clear timers, delete stored state
5. **Store per-element state** on `elt._htmx` (htmx creates this object)
6. **Store per-request state** on `detail.ctx` (available across all hooks for one request)
7. **Follow `hx-` prefix** for custom attributes (e.g. `hx-my-feature`)
8. **Follow `hx-{name}.js`** file naming convention
9. **Reference existing extensions** in `src/ext/` for patterns -- `hx-preload.js` is the cleanest example
10. **Debug with `htmx.config.logAll = true`** to see all events firing

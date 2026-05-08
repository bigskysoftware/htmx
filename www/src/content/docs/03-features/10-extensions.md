---
title: "Extensions"
description: "Load, configure, and build htmx extensions."
keywords: ["extensions", "plugins", "custom", "building", "creating"]
---

htmx supports extensions to augment its core hypermedia infrastructure. The extension mechanism takes pressure off the core library to add new features, allowing it to focus on its main purpose of generalizing hypermedia controls.

For the catalog of core extensions shipped with htmx, see [/extensions](/extensions).

## Using Extensions

In htmx 4, extensions hook into standard events rather than callback extension points. They are lightweight with no performance penalty.

Extensions apply page-wide without requiring `hx-ext` on parent elements. They activate via custom attributes where needed.

### Loading an Extension

Include the extension script after htmx. Core extensions ship with htmx in the `/ext/` directory:

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-sse.js"></script>
```

Or with a bundler:

```javascript
import 'htmx.org';
import 'htmx.org/dist/ext/hx-sse';
```

### Restricting Extensions

To restrict which extensions can register, use an allow list:

```html
<meta name="htmx-config" content='{"extensions": "my-ext,another-ext"}'>
```

When this config is set, only the listed extensions will be loaded. Without it, all registered extensions are active.

## Building Extensions

htmx 4 introduces an extension system based on event hooks rather than the old callback-based API.

### Defining an Extension

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

### Event Hooks

Extensions hook into htmx lifecycle events. Event names use underscores instead of colons:

#### Core Lifecycle Events

| Hook Name | Triggered Event | Parameters | Description |
|-----------|----------------|------------|-------------|
| `htmx_before_init` | [`htmx:before:init`](/reference/events/htmx-before-init) | `(elt, detail)` | Before element initialization |
| `htmx_after_init` | [`htmx:after:init`](/reference/events/htmx-after-init) | `(elt, detail)` | After element initialization |
| `htmx_before_process` | [`htmx:before:process`](/reference/events/htmx-before-process) | `(elt, detail)` | Before processing element |
| `htmx_after_process` | [`htmx:after:process`](/reference/events/htmx-after-process) | `(elt, detail)` | After processing element |
| `htmx_before_cleanup` | [`htmx:before:cleanup`](/reference/events/htmx-before-cleanup) | `(elt, detail)` | Before cleaning up element |
| `htmx_after_cleanup` | [`htmx:after:cleanup`](/reference/events/htmx-after-cleanup) | `(elt, detail)` | After cleaning up element |

#### Request Lifecycle Events

| Hook Name | Triggered Event | Parameters | Description |
|-----------|----------------|------------|-------------|
| `htmx_config_request` | [`htmx:config:request`](/reference/events/htmx-config-request) | `(elt, detail)` | Configure request before sending |
| `htmx_before_request` | [`htmx:before:request`](/reference/events/htmx-before-request) | `(elt, detail)` | Before request is sent |
| `htmx_before_response` | `htmx:before:response` | `(elt, detail)` | After fetch, before body consumed |
| `htmx_after_request` | [`htmx:after:request`](/reference/events/htmx-after-request) | `(elt, detail)` | After request completes |
| `htmx_finally_request` | [`htmx:finally:request`](/reference/events/htmx-finally-request) | `(elt, detail)` | Always called after request |
| `htmx_error` | [`htmx:error`](/reference/events/htmx-error) | `(elt, detail)` | On request error |

#### Swap Events

| Hook Name | Triggered Event | Parameters | Description |
|-----------|----------------|------------|-------------|
| `htmx_before_swap` | [`htmx:before:swap`](/reference/events/htmx-before-swap) | `(elt, detail)` | Before content swap |
| `htmx_after_swap` | [`htmx:after:swap`](/reference/events/htmx-after-swap) | `(elt, detail)` | After content swap |
| `htmx_before_settle` | `htmx:before:settle` | `(elt, detail)` | Before settle phase |
| `htmx_after_settle` | `htmx:after:settle` | `(elt, detail)` | After settle phase |
| `handle_swap` | _(direct call)_ | `(swapStyle, target, fragment, swapSpec)` | Custom swap handler |

#### History Events

| Hook Name | Triggered Event | Parameters | Description |
|-----------|----------------|------------|-------------|
| `htmx_before_history_update` | [`htmx:before:history:update`](/reference/events/htmx-before-history-update) | `(elt, detail)` | Before updating history |
| `htmx_after_history_update` | [`htmx:after:history:update`](/reference/events/htmx-after-history-update) | `(elt, detail)` | After updating history |
| `htmx_after_history_push` | [`htmx:after:history:push`](/reference/events/htmx-after-push-into-history) | `(elt, detail)` | After pushing to history |
| `htmx_after_history_replace` | [`htmx:after:history:replace`](/reference/events/htmx-after-replace-into-history) | `(elt, detail)` | After replacing history |
| `htmx_before_history_restore` | [`htmx:before:history:restore`](/reference/events/htmx-before-restore-history) | `(elt, detail)` | Before restoring from history |

### Cancelling Events

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

### Internal API

The `init` hook receives an internal API object with helper methods:

```javascript
let api;

htmx.registerExtension("my-ext", {
    init: (internalAPI) => {
        api = internalAPI;
    },

    htmx_after_init: (elt) => {
        let value = api.attributeValue(elt, "hx-my-attr");
        let specs = api.parseTriggerSpecs("click, keyup delay:500ms");
        let { method, action } = api.determineMethodAndAction(elt, evt);
    },
});
```

Available internal API methods:

- `attributeValue(elt, name, defaultVal, returnElt)` - Get htmx attribute value with inheritance
- `parseTriggerSpecs(spec)` - Parse trigger specification string
- `determineMethodAndAction(elt, evt)` - Get HTTP method and URL
- `createRequestContext(elt, evt)` - Create request context object
- `collectFormData(elt, form, submitter)` - Collect form data
- `handleHxVals(elt, body)` - Process [`hx-vals`](/reference/attributes/hx-vals) attribute

### Request Context

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

### Custom Swap Strategies

Extensions can implement custom swap strategies:

```javascript
htmx.registerExtension("my-swap", {
    handle_swap: (swapStyle, target, fragment, swapSpec) => {
        if (swapStyle === "my-custom-swap") {
            target.appendChild(fragment);
            return true; // Handled
        }
        return false; // Not handled
    },
});
```

For migrating extensions written for htmx 2.x, see [Migration → Migrating Your Own Extensions](/docs/get-started/migration#migrating-your-own-extensions).

# Event Hooks and Cancellation

## Event Hooks Reference

A hook name is the event name with every colon replaced by an underscore. `htmx:before:morph:node`
becomes `htmx_before_morph_node`. Any event htmx dispatches can be hooked this way, including events
that other extensions dispatch. All hooks receive `(elt, detail)` unless noted.

### Core Lifecycle

| Hook | Event | Description |
|------|-------|-------------|
| `htmx_before_init` | `htmx:before:init` | Before element initialization |
| `htmx_after_init` | `htmx:after:init` | After element initialization |
| `htmx_before_process` | `htmx:before:process` | Before processing element |
| `htmx_after_process` | `htmx:after:process` | After processing element |
| `htmx_before_cleanup` | `htmx:before:cleanup` | Before cleaning up element |
| `htmx_after_cleanup` | `htmx:after:cleanup` | After cleaning up element |
| `htmx_before_on_init` | `htmx:before:on:init` | Before an `hx-on` handler is installed |

### Request Lifecycle

| Hook | Event | Description |
|------|-------|-------------|
| `htmx_config_request` | `htmx:config:request` | Configure request (modify headers, body, URL) |
| `htmx_before_request` | `htmx:before:request` | Before request is sent |
| `htmx_before_response` | `htmx:before:response` | After fetch response, before body consumed |
| `htmx_after_request` | `htmx:after:request` | After request completes |
| `htmx_finally_request` | `htmx:finally:request` | When request completes, fails, or is cancelled |
| `htmx_confirm` | `htmx:confirm` | After trigger, before request. Detail carries `issueRequest` and `dropRequest` |
| `htmx_error` | `htmx:error` | On any error |
| `htmx_response_error` | `htmx:response:error` | The server returned an HTTP error status |

### Swap

| Hook | Event | Description |
|------|-------|-------------|
| `htmx_before_swap` | `htmx:before:swap` | Before content swap |
| `htmx_after_swap` | `htmx:after:swap` | After content swap |
| `htmx_finally_swap` | `htmx:finally:swap` | After swap (success or error) |
| `htmx_before_settle` | `htmx:before:settle` | Before settle phase |
| `htmx_after_settle` | `htmx:after:settle` | After settle phase |
| `htmx_before_morph_node` | `htmx:before:morph:node` | Before a node is morphed. Cancel to keep the existing node |
| `htmx_before_morph_attr` | `htmx:before:morph:attr` | Before an attribute is morphed. Cancel to keep the existing value |
| `handle_swap` | _(direct call)_ | Custom swap handler. Signature: `(swapStyle, target, fragment, swapSpec)`. Return truthy if handled. |

### History

| Hook | Event |
|------|-------|
| `htmx_before_history_update` | `htmx:before:history:update` |
| `htmx_after_history_update` | `htmx:after:history:update` |
| `htmx_after_history_push` | `htmx:after:history:push` |
| `htmx_after_history_replace` | `htmx:after:history:replace` |
| `htmx_before_history_restore` | `htmx:before:history:restore` |

### View Transitions

| Hook | Event |
|------|-------|
| `htmx_before_viewTransition` | `htmx:before:viewTransition` |
| `htmx_after_viewTransition` | `htmx:after:viewTransition` |

### Other

| Hook | Event |
|------|-------|
| `htmx_after_implicitInheritance` | `htmx:after:implicitInheritance` |
| `htmx_process_<type>` | _(extensions only)_ |

`htmx_process_<type>` handles a `<template hx type="<type>">` element in a response. `hx-upsert.js` uses
`htmx_process_upsert` this way. `htmx_before_morph_node`, `htmx_before_morph_attr` and
`htmx_after_implicitInheritance` also reach extensions only. They are never dispatched to the DOM.

## Cancelling Events

Return `false` or set `detail.cancelled = true`:

```javascript
htmx_before_request: (elt, detail) => {
    if (!isValid(detail.ctx)) {
        return false; // Cancel the request
    }
},
```

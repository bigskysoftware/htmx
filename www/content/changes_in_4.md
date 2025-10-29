+++
title = "Changes in htmx 4.0"
+++

This document outlines the major changes between htmx 2.x and htmx 4.x.

## Major Breaking Changes

### fetch() API replaces XMLHttpRequest
- All AJAX requests now use the native fetch() API instead of XMLHttpRequest
- Enables streaming response support
- Better integration with modern web platform features
- May affect custom request/response interceptors

### Explicit Attribute Inheritance
- Attribute inheritance now requires the `:inherited` modifier
- In htmx 2.x, attributes were inherited automatically from parent elements
- In htmx 4.x, use `hx-attribute:inherited="value"` syntax to inherit
- Applies to all inheritable attributes: `hx-boost:inherited`, `hx-target:inherited`, `hx-confirm:inherited`, etc.
- Improves locality of behavior by making inheritance explicit

### Default Swap Style Changed
- Default swap style changed from `innerHTML` to `outerHTML`
- Affects elements without explicit `hx-swap` attribute
- Set `htmx.config.defaultSwapStyle = "innerHTML"` to restore previous behavior

### Event Naming Convention Changed
- New event naming convention: `htmx:phase:action` (colon-separated)
- All event names updated (see Event Changes section below)
- More consistent and predictable event naming

## New Features

### Built-in Server-Sent Events (SSE) Support
- SSE functionality now built into core htmx (no extension needed)
- Use `hx-sse` attribute for SSE connections
- Improved event handling and reconnection logic

### Optimistic Updates
- New `hx-optimistic` attribute for optimistic UI updates
- Shows content immediately while request is in flight
- Automatically reverts on request failure

### Server Actions (Partials)
- New `<htmx-action type="partial">` element system
- Cleaner approach for multi-target responses
- Simplifies complex page updates

### Request Preloading
- New `hx-preload` attribute
- Preload requests on specified trigger events
- Improves perceived performance

### View Transitions
- View Transitions API enabled by default
- Provides smooth animated transitions between DOM states
- Set `htmx.config.viewTransitions = false` to disable

### Scripting API
- New unified scripting API for async operations
- Better integration points for custom JavaScript
- Improved support for async/await patterns

### Unified Request Context
- All events now provide consistent `ctx` object
- Easier to access request/response information
- More predictable event handling

## Attribute Changes

### Renamed Attributes
- `hx-disabled-elt` renamed to `hx-disable`

### Removed Attributes
- `hx-vars` - use `hx-vals` with `js:` prefix instead
- `hx-params` - use `htmx:config:request` event to filter parameters
- `hx-prompt` - use `hx-confirm` with async JavaScript function
- `hx-ext` - extensions now work via event listeners
- `hx-disinherit` - no longer needed (inheritance is explicit)
- `hx-inherit` - no longer needed (inheritance is explicit)
- `hx-request` - use `hx-config` instead
- `hx-history` - removed (history no longer uses local storage)
- `hx-history-elt` - removed (history uses target element)
- `hx-select-oob` - use server actions or standard OOB swaps

### New Attributes
- `hx-action` - specifies URL for requests (use with `hx-method`)
- `hx-method` - specifies HTTP method (use with `hx-action`)
- `hx-config` - configure request behavior using JSON
- `hx-optimistic` - enable optimistic updates
- `hx-preload` - preload requests on trigger events
- `hx-ignore` - replaces htmx 2.x `hx-disable` for disabling htmx processing

## Event Changes

### Event Name Mappings
- `htmx:afterOnLoad` → `htmx:after:init`
- `htmx:afterProcessNode` → `htmx:after:init`
- `htmx:afterRequest` → `htmx:after:request`
- `htmx:afterSettle` → `htmx:after:swap`
- `htmx:afterSwap` → `htmx:after:swap`
- `htmx:beforeCleanupElement` → `htmx:before:cleanup`
- `htmx:beforeHistorySave` → `htmx:before:history:update`
- `htmx:beforeOnLoad` → `htmx:before:init`
- `htmx:beforeProcessNode` → `htmx:before:init`
- `htmx:beforeRequest` → `htmx:before:request`
- `htmx:beforeSwap` → `htmx:before:swap`
- `htmx:configRequest` → `htmx:config:request`
- `htmx:historyCacheMiss` → `htmx:before:restore:history`
- `htmx:historyRestore` → `htmx:after:restore:history`
- `htmx:load` → `htmx:after:init`
- `htmx:oobAfterSwap` → `htmx:after:oob:swap`
- `htmx:oobBeforeSwap` → `htmx:before:oob:swap`
- `htmx:pushedIntoHistory` → `htmx:after:push:into:history`
- `htmx:replacedInHistory` → `htmx:after:replace:into:history`
- `htmx:responseError` → `htmx:error`
- `htmx:sendError` → `htmx:error`
- `htmx:swapError` → `htmx:error`
- `htmx:targetError` → `htmx:error`
- `htmx:timeout` → `htmx:error`

### New Events
- `htmx:after:cleanup`
- `htmx:after:history:update`
- `htmx:after:main:swap`
- `htmx:after:partial:swap`
- `htmx:before:main:swap`
- `htmx:before:partial:swap`
- `htmx:finally:request`

## Configuration Changes

### Changed Defaults
- `viewTransitions` (formerly `globalViewTransitions`) now defaults to `true` (was `false`)

### Removed Config Options
- `wsReconnectDelay` - moved to WebSocket extension
- `wsBinaryType` - moved to WebSocket extension

## Extension System Changes

### Extensions Are Now Event-Based
- Extensions no longer require explicit `hx-ext` attribute
- Extensions now work by listening to standard htmx events
- No explicit extension API - use public htmx API and events
- Simpler extension architecture

## History Management Changes

### History Storage
- History no longer uses localStorage
- History now uses sessionStorage for local cache
- Prevents cross-tab contamination
- More reliable history restoration

## SSE and WebSocket Changes

### SSE Built Into Core
- SSE functionality moved from extension to core
- No longer need to include SSE extension
- Better integration with htmx lifecycle

### WebSocket Moved to Extension
- WebSocket functionality remains in extension
- Configuration options moved to extension

## Behavioral Changes

### Form Parameter Inclusion
- Non-GET requests include enclosing form values
- GET requests do not include form values by default
- Use `hx-include` to include form values in GET requests

### Error Response Handling
- Error responses (4xx, 5xx) behavior may differ
- Configure via `htmx.config.responseHandling`

### DELETE Request Parameters
- DELETE requests now use URL parameters (per HTTP spec)
- Previously used form-encoded body in htmx 2.x
- More standards-compliant behavior

## Migration Recommendations

### Step 1: Update Event Listeners
- Search codebase for old event names
- Update to new `htmx:phase:action` convention
- Test all event-based functionality

### Step 2: Add :inherited Modifiers
- Audit all uses of inherited attributes
- Add `:inherited` modifier where needed
- This is likely the most time-consuming change

### Step 3: Test Swap Behavior
- Review elements relying on default swap
- Add explicit `hx-swap="innerHTML"` if needed
- Test all page updates

### Step 4: Update Removed Attributes
- Replace `hx-vars` with `hx-vals`
- Replace `hx-request` with `hx-config`
- Update other removed attributes per mapping

### Step 5: Test Extensions
- Update or replace custom extensions
- Use new event-based extension model
- Test extension functionality thoroughly

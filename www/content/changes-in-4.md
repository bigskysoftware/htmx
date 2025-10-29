+++
title = "Changes in htmx 4.0"
+++

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>These docs are NOT up to date with the htmx 4.0 changes and are in flux!</p>
</aside>

This document outlines the major changes between htmx 2.x and htmx 4.x.

## Major Breaking Changes

### fetch() API replaces XMLHttpRequest
- All AJAX requests now use the native fetch() API instead of XMLHttpRequest
- Enables streaming response support
- Simplifies implementation of htmx significantly

### Explicit Attribute Inheritance
- Attribute inheritance is now _explicit_, using the `:inherited` modifier
- In htmx 4.x use `hx-attribute:inherited="value"` syntax to inherit
- Applies to all inheritable attributes: `hx-boost:inherited`, `hx-target:inherited`, `hx-confirm:inherited`, etc.
- Improves locality of behavior by making inheritance explicit

### Event Naming Convention Changed
- New event naming convention: `htmx:phase:action` (colon-separated)
- All event names updated (see Event Changes section below)
- More consistent and predictable event naming

### History Storage
- History no longer uses localStorage
- History now uses sessionStorage for local cache
- Prevents cross-tab contamination
- More reliable history restoration
- This is more of a "fixing" change than a "breaking" change :)

## New Features

### Morphing Swap
- New `morph` swap is now available, based on the original `idiomorph` algorithm
- Does a better job of preserving local state when targeting large DOM trees

### Request Preloading
- New `hx-preload` attribute
- Preload requests on specified trigger events
- Improves perceived performance

### Optimistic Updates
- New `hx-optimistic` attribute for optimistic UI updates
- Shows content immediately while request is in flight
- Automatically reverts on request failure

### Server Actions (Partials)
- New `<htmx-action type="partial">` element system
- Cleaner approach for multi-target responses
- Simplifies more complex page updates

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

### Built-in Streaming Response Support
- Streaming functionality now built into core htmx
- Improved event handling and reconnection logic

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

### Extensions Are Now Event-Based
- Extensions no longer require explicit `hx-ext` attribute
- Extensions now work by listening to standard htmx events
- No explicit extension API - use public htmx API and events
- Simpler extension architecture


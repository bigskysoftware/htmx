+++
title = "Changes in htmx 4.0"
[extra]
table_of_contents = true
+++

htmx 4.0 is a ground up rewrite of the implementation of htmx, using the `fetch()` API.  This document outlines the 
major changes between htmx 2.x and htmx 4.x.

## Major Changes

### fetch() API replaces XMLHttpRequest
- All AJAX requests now use the native fetch() API instead of XMLHttpRequest
- Enables streaming response support
- Simplifies implementation of htmx significantly

### Explicit Attribute Inheritance
- Attribute inheritance is now explicit by default, using the `:inherited` modifier
- By default, in htmx 4.x you now use `hx-attribute:inherited="value"` syntax to inherit an attribute
- This applies to all inheritable attributes: `hx-boost:inherited`, `hx-target:inherited`, `hx-confirm:inherited`, etc.
- This improves locality of behavior by making inheritance explicit
- You can revert to implicit inheritance by setting `htmx.config.implicitInheritance` to `true`

### Event Naming Convention Changed
- New event naming convention: `htmx:phase:action[:sub-action]` (colon-separated)
- Many event names have changed (See the [migration guide](/migration-guide-htmx-4#event-changes))
- This provides more consistent & predictable event naming

### History Storage
- History no longer uses `localStorage` to store snapshots of previous pages
- History now issues a full page refresh request on history navigation
- This is a much, much more reliable history restoration mechanic
- We will be creating a caching history extension for people that want the old behavior

### Non-200 Swapping Defaults
- In htmx 2.0, responses with `4xx` and `5xx` response codes did not swap by default
- In htmx 4.0, all responses will swap except for [`204 - No Content`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/204)
  and [`304 - Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304)
- You can revert to not swapping `4xx` and `5xx` responses by setting `htmx.config.noSwap` to `[204, 304, '4xx', '5xx']`

## New Features

### Morphing Swap
- htmx now ships with morph swap styles are now available, based on the original `idiomorph` algorithm
- `innerMorph` - morphs the children of the target element
- `outerMorph` - morphs the target element itself
- Does a better job of preserving local state when targeting large DOM trees

### Built-in Streaming Response Support
- Streaming functionality/SSE now built into core htmx
- Improved event handling and reconnection logic 
- Configure globally using `<meta name="htmx-config">`
   ```html
   <!-- Global defaults -->
   <meta name="htmx-config" content="{
       streams:{
         reconnect: false,
         reconnectDelay: 500,
         reconnectMaxDelay: 60000,
         reconnectMaxAttempts: 10,
         reconnectJitter: 0.3,
         pauseInBackground: false
       }
   }">
   ```
- Or per-element using `hx-config` attribute
  ```html
  <!-- Overrides global default -->
  <div hx-get="/events" 
       hx-trigger="load"
       hx-config="{stream: {reconnect: true}}"
  ```

### View Transitions
- View Transitions API enabled by default (maybe not!)
- Provides smooth animated transitions between DOM states
- Set `htmx.config.transitions = false` to disable

### Scripting API
- New unified scripting API for async operations
- Better integration points for custom JavaScript
- Improved support for async/await patterns

### Unified Request Context
- All events now provide consistent `ctx` object
- Easier to access request/response information
- More predictable event handling

### Modern Swap Terminology
- New modern swap style names supported alongside classic names
- `before` (equivalent to `beforebegin`)
- `after` (equivalent to `afterend`)
- `prepend` (equivalent to `afterbegin`)
- `append` (equivalent to `beforeend`)
- Both old and new terminology work (backward compatible)
- Example: `hx-swap="prepend"` works the same as `hx-swap="afterbegin"`

### Inheritance Attribute Modifiers
- New `:append` modifier for attributes to append values to inherited values
- Values are comma-separated when appended
- Example: `hx-include:append=".child"` appends `.child` to any inherited `hx-include` value
- Can be combined with `:inherited` for chaining: `hx-include:inherited:append=".parent"`
- Works with all htmx attributes that accept value lists

### HTTP Status Code Conditional Swapping
- New `hx-status:XXX` attribute pattern for status-specific swap behaviors
- Allows different swap strategies based on HTTP response status
- Supports exact codes: `hx-status:404="none"`
- Supports wildcards: `hx-status:2xx="innerHTML"`, `hx-status:5xx="#error"`
- Example: `hx-status:404="#not-found"` swaps into different target on 404
- Overrides default swap behavior when status code matches

### Partial Tags
- New `<hx-partial>` tag for multiple targeted swaps in one response
- Provides explicit control over swap targets via `hx-target` attribute
- Alternative to out-of-band swaps when you want explicit targeting
- Example:
  ```html
  <hx-partial hx-target="#messages" hx-swap="beforeend">
    <div>New message</div>
  </hx-partial>
  <hx-partial hx-target="#notifications">
    <span class="badge">5</span>
  </hx-partial>
  ```
- Each partial specifies its own target and swap strategy
- More explicit than OOB swaps which rely on matching `id` attributes

## Attribute Changes

### Renamed Attributes
- `hx-disable` renamed to `hx-ignore`
- `hx-disabled-elt` renamed to `hx-disable` :/

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

### New Attributes
- `hx-action` - specifies URL for requests (use with `hx-method`)
- `hx-method` - specifies HTTP method (use with `hx-action`)
- `hx-config` - configure request behavior using JSON
- `hx-status:XXX` - conditional swap behavior based on HTTP status code (e.g., `hx-status:404="none"`)
- `hx-ignore` - replaces htmx 2.x `hx-disable` for disabling htmx processing

### Attribute Modifier Syntax
- `:inherited` - explicitly inherit attribute value from parent (e.g., `hx-target:inherited="this"`)
- `:append` - append value to inherited value (e.g., `hx-include:append=".child"`)
- `:inherited:append` - combine inheritance and appending (e.g., `hx-vals:inherited:append='{"key":"value"}'`)

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
- `htmx:after:cleanup` - fires after element cleanup completes
- `htmx:after:history:update` - fires after history state is updated
- `htmx:after:process` - fires after element processing completes
- `htmx:before:settle` - fires before settle phase begins
- `htmx:after:settle` - fires after settle phase completes
- `htmx:finally:request` - fires in finally block after request (success or error)
- `htmx:before:sse:stream` - fires before SSE stream begins
- `htmx:after:sse:stream` - fires after SSE stream ends
- `htmx:before:sse:message` - fires before processing SSE message
- `htmx:after:sse:message` - fires after processing SSE message
- `htmx:before:sse:reconnect` - fires before attempting SSE reconnection
- `htmx:before:viewTransition` - fires before view transition starts
- `htmx:after:viewTransition` - fires after view transition completes

### Extensions Are Now Globally Registered
- Extensions no longer require an explicit `hx-ext` attribute
- Simpler extension architecture

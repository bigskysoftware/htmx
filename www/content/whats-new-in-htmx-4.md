+++
title = "Changes in htmx 4.0"
[extra]
table_of_contents = true
+++

htmx 4.0 is a ground up rewrite of the implementation of htmx, using the `fetch()` API.  This document outlines the
major changes between htmx 2.x and htmx 4.x.

If you are upgrading from htmx 2.x, see the [htmx 2.x → 4.x Migration Guide](/migration-guide-htmx-4) for
step-by-step instructions, including attribute renames, removed attributes, event name mappings, and HTTP header changes.

## Major Changes

### fetch() API replaces XMLHttpRequest

All AJAX requests now use the native fetch() API instead of XMLHttpRequest.

- Enables streaming response support
- Simplifies implementation of htmx significantly

### Explicit Attribute Inheritance

Attribute inheritance is now explicit by default, using the `:inherited` modifier (e.g. `hx-target:inherited="value"`).
This improves locality of behavior by making inheritance visible in the markup.

- Applies to all inheritable attributes: `hx-boost:inherited`, `hx-target:inherited`, `hx-confirm:inherited`, etc.
- You can revert to implicit inheritance by setting `htmx.config.implicitInheritance` to `true`

### Event Naming Convention Changed

Events now use a colon-separated naming convention: `htmx:phase:action[:sub-action]`.

- This provides more consistent & predictable event naming
- Many event names have changed (see the [migration guide](/migration-guide-htmx-4#event-name-changes) for the full mapping table)

### History Storage

History no longer uses `localStorage` to store snapshots of previous pages.

- History now issues a full page refresh request on history navigation
- This is a much, much more reliable history restoration mechanic

### Non-200 Swapping Defaults

In htmx 4.0, all responses will swap by default, not just `2xx` responses.

- Only [`204 - No Content`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/204)
  and [`304 - Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304) do not swap
- You can revert to not swapping `4xx` and `5xx` responses by setting `htmx.config.noSwap` to `[204, 304, '4xx', '5xx']`

### GET/DELETE Form Data

Like [`hx-get`](/attributes/hx-get), [`hx-delete`](/attributes/hx-delete) does not include the enclosing form's
inputs by default. Use [`hx-include`](/attributes/hx-include)`="closest form"` if you need this behavior.

### Out-of-Band Swap Order

Out-of-band ([`hx-swap-oob`](/attributes/hx-swap-oob)) and partial swaps now happen *after* the main content swap,
rather than before as in htmx 2.

### Default Timeout

htmx 4 sets a default request timeout of 60 seconds (`htmx.config.defaultTimeout = 60000`).

- In htmx 2, the default timeout was `0` (no timeout), meaning requests could hang indefinitely
- Set `htmx.config.defaultTimeout` to `0` to restore the old behavior

### Extension Loading

Extensions no longer use the `hx-ext` attribute. They are activated by including the script file:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-sse.js"></script>
```

To restrict which extensions can load, use the `extensions` config as a whitelist:

```html
<meta name="htmx-config" content='{"extensions": "sse, ws"}'>
```

## New Features

### Morphing Swap

htmx now ships with morph swap styles based on the original `idiomorph` algorithm.

- `innerMorph` - morphs the children of the target element
- `outerMorph` - morphs the target element itself
- Does a better job of preserving local state when targeting large DOM trees

### hx-config Attribute

The new [`hx-config`](/attributes/hx-config) attribute allows per-element request configuration.

- Accepts JSON or key:value syntax
- Example: `hx-config='{"timeout": 5000}'` or `hx-config="timeout:5000"`

### HTTP Status Code Conditional Swapping

The new [`hx-status`](/attributes/hx-status)`:XXX` attribute pattern allows different swap behaviors based on HTTP response status.

- Supports exact codes (`hx-status:404`) and wildcards (`hx-status:5xx`, `hx-status:50x`)
- Value uses config syntax to set context properties: `target:`, `swap:`, `select:`, etc.
- Example: `hx-status:422="select:#errors target:#error-container"`
- Example: `hx-status:5xx="swap:none"`

### `hx-partial` Tags

The new `<hx-partial>` tag allows multiple targeted swaps in a single response, providing a cleaner
alternative to out-of-band swaps.

- Each partial specifies its own target via `hx-target` and swap strategy via `hx-swap`
- Example:
  ```html
  <hx-partial hx-target="#messages" hx-swap="beforeend">
    <div>New message</div>
  </hx-partial>
  <hx-partial hx-target="#notifications">
    <span class="badge">5</span>
  </hx-partial>
  ```

### hx-action and hx-method

The [`hx-action`](/attributes/hx-action) and  [`hx-method`](/attributes/hx-method) attributes have been added alongside
`hx-get` for people who want an API more consistent with the existing browser attributes

- [`hx-action`](/attributes/hx-action) specifies URL for requests
- [`hx-method`](/attributes/hx-method) specifies HTTP method

### Modern Swap Terminology

New modern swap style names are  supported alongside the traditional names:

- `before` (equivalent to `beforebegin`)
- `after` (equivalent to `afterend`)
- `prepend` (equivalent to `afterbegin`)
- `append` (equivalent to `beforeend`)
- Both old and new terminology work (backward compatible)
- Example: `hx-swap="prepend"` works the same as `hx-swap="afterbegin"`

### Inheritance Attribute Modifiers

A new `:append` modifier for attributes can be used to append values to inherited values
 
- Values are comma-separated when appended
- Example: `hx-include:append=".child"` appends `.child` to any inherited `hx-include` value
- Can be combined with `:inherited` for chaining: `hx-include:inherited:append=".parent"`
- Works with all htmx attributes that accept value lists

### View Transitions

[View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) support is available but disabled by default.

- Provides smooth animated transitions between DOM states
- Set `htmx.config.transitions = true` to enable

### Scripting API

New async helper methods make it easier to integrate custom JavaScript with htmx.

- `htmx.forEvent(eventName, timeout)` - returns a promise that resolves when an event fires
- `htmx.timeout(time)` - returns a promise that resolves after specified time

### Unified Request Context

All events now provide a consistent `ctx` object with request/response information.

- Easier to access request/response information in event handlers
- More predictable event handling across the request lifecycle

### Polling Tags (PTag Extension)

The [ptag extension](/extensions/ptag) provides per-element polling optimization via the `hx-ptag` attribute.

- Server sends an `HX-PTag` response header with a version token
- Subsequent requests include the stored ptag as an `HX-PTag` request header
- Server returns `304 Not Modified` when content hasn't changed, skipping the swap

### JSX-Compatible Attribute Names

The new `metaCharacter` config option allows replacing `:` in attribute names with a custom character for
frameworks that don't support colons in attribute names.

- Example: setting `htmx.config.metaCharacter = "-"` allows `hx-ws-connect` instead of `hx-ws:connect`
- Useful for JSX/TSX, Vue, and other template systems with strict attribute name rules

### Server-Sent Events Extension

SSE support is provided via the [SSE extension](/extensions/sse), rewritten from scratch for htmx 4.

- Uses Fetch + ReadableStream instead of EventSource (supports POST, custom headers, cookies)
- Two modes: one-off streams via any `hx-*` request returning `text/event-stream`, persistent connections via `hx-sse:connect`

### Core Extensions

htmx 4 ships with 12 core extensions:

{{ include(path="content/extensions/core-extensions-table.html") }}

See the [Extensions documentation](/extensions) for details.

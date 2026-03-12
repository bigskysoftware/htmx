---
title: "Upgrade Guide"
description: "Upgrade from htmx 2.x with this migration guide"
thumbnail: "docs/upgrade-guide.svg"
---

This guide helps you migrate from **htmx 2.x** to **htmx 4.x** and covers all breaking changes.

## Quick Start

Restore **htmx 2.x** behavior:

```html
<script>
    htmx.config.implicitInheritance = true;         // Restore implicit inheritance
    htmx.config.noSwap = [204, 304, '4xx', '5xx'];  // Don't swap errors
</script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
```

Most **htmx 2.0** apps should work with these two lines.

## Major Changes

### ~~`XMLHttpRequest`~~ replaced by `fetch()`

- All requests now use the native `fetch()` API
- Enables streaming response support
- Cannot be reverted

### Explicit Attribute Inheritance

Inheritance now requires the `:inherited` modifier.

**htmx 2.x:**
```html
<div hx-confirm="Are you sure?">
    <button hx-delete="/item/1">Delete</button>
</div>
```

**htmx 4.x:**
```html
<div hx-confirm:inherited="Are you sure?">
    <button hx-delete="/item/1">Delete</button>
</div>
```

Use `:inherited` on any attribute: [`hx-boost`](/reference/attributes/hx-boost)`:inherited`, [`hx-target`](/reference/attributes/hx-target)`:inherited`, etc.

Restore old behavior: `htmx.config.implicitInheritance = true`

### Responses Swap by Default

htmx 4 swaps all HTTP responses except `204` and `304`.

htmx 2 didn't swap `4xx` and `5xx` responses. htmx 4 does.

Restore old behavior: `htmx.config.noSwap = [204, 304, '4xx', '5xx']`

### History Uses Full Refresh

History no longer uses localStorage. Navigation triggers full page refresh.

More reliable. Cannot be reverted.

## Attribute Changes

### Step 1: Rename `hx-disable`

**Before upgrading:**

1. Search for `hx-disable` in your codebase
2. Rename all `hx-disable` → [`hx-ignore`](/reference/attributes/hx-ignore)
3. Then rename `hx-disabled-elt` → `hx-disable`

### Removed Attributes

| Attribute        | Use Instead                          |
|------------------|--------------------------------------|
| `hx-vars`        | [`hx-vals`](/reference/attributes/hx-vals) with `js:` prefix          |
| `hx-params`      | [`htmx:config:request`](/reference/events/htmx-config-request) event          |
| `hx-prompt`      | [`hx-confirm`](/reference/attributes/hx-confirm) with async function     |
| `hx-ext`         | Extensions work via events now       |
| `hx-disinherit`  | Not needed (explicit inheritance)    |
| `hx-inherit`     | Not needed (explicit inheritance)    |
| `hx-request`     | [`hx-config`](/reference/attributes/hx-config)                          |
| `hx-history`     | Removed (no localStorage)            |
| `hx-history-elt` | Removed (uses target element)        |

### New Attributes

| Attribute    | Purpose                           |
|--------------|-----------------------------------|
| [`hx-action`](/reference/attributes/hx-action)  | Specify URL (use with [`hx-method`](/reference/attributes/hx-method)) |
| `hx-method`  | Specify HTTP method               |
| `hx-config`  | Configure requests with JSON      |
| `hx-ignore`  | Disable htmx processing (was `hx-disable`) |

## Event Name Changes

Find and replace event names in your JavaScript:

| htmx 2.x                    | htmx 4.x                          |
|-----------------------------|-----------------------------------|
| `htmx:afterOnLoad`          | [`htmx:after:init`](/reference/events/htmx-after-init)                 |
| `htmx:afterProcessNode`     | `htmx:after:init`                 |
| `htmx:afterRequest`         | [`htmx:after:request`](/reference/events/htmx-after-request)              |
| `htmx:afterSettle`          | [`htmx:after:swap`](/reference/events/htmx-after-swap)                 |
| `htmx:afterSwap`            | `htmx:after:swap`                 |
| `htmx:beforeCleanupElement` | [`htmx:before:cleanup`](/reference/events/htmx-before-cleanup)             |
| `htmx:beforeHistorySave`    | [`htmx:before:history:update`](/reference/events/htmx-before-history-update)      |
| `htmx:beforeOnLoad`         | [`htmx:before:init`](/reference/events/htmx-before-init)                |
| `htmx:beforeProcessNode`    | [`htmx:before:process`](/reference/events/htmx-before-process)             |
| `htmx:beforeRequest`        | [`htmx:before:request`](/reference/events/htmx-before-request)             |
| `htmx:beforeSwap`           | [`htmx:before:swap`](/reference/events/htmx-before-swap)                |
| `htmx:configRequest`        | `htmx:config:request`             |
| `htmx:historyCacheMiss`     | [`htmx:before:restore:history`](/reference/events/htmx-before-restore-history)     |
| `htmx:historyRestore`       | `htmx:before:restore:history`     |
| `htmx:load`                 | `htmx:after:init`                 |
| `htmx:oobAfterSwap`         | `htmx:after:swap`                 |
| `htmx:oobBeforeSwap`        | `htmx:before:swap`                |
| `htmx:pushedIntoHistory`    | [`htmx:after:push:into:history`](/reference/events/htmx-after-push-into-history)    |
| `htmx:replacedInHistory`    | [`htmx:after:replace:into:history`](/reference/events/htmx-after-replace-into-history) |
| `htmx:responseError`        | [`htmx:error`](/reference/events/htmx-error)                      |
| `htmx:sendError`            | `htmx:error`                      |
| `htmx:swapError`            | `htmx:error`                      |
| `htmx:targetError`          | `htmx:error`                      |
| `htmx:timeout`              | `htmx:error`                      |

**New naming pattern:** `htmx:phase:action[:sub-action]`

All error events consolidated to `htmx:error`.

## JavaScript API Changes

### Removed Methods

Use native JavaScript instead:

| htmx 2.x Method      | Use Instead                       |
|----------------------|-----------------------------------|
| `htmx.addClass()`    | `element.classList.add()`         |
| `htmx.removeClass()` | `element.classList.remove()`      |
| `htmx.toggleClass()` | `element.classList.toggle()`      |
| `htmx.closest()`     | `element.closest()`               |
| `htmx.remove()`      | `element.remove()`                |
| `htmx.off()`         | `removeEventListener()`           |
| `htmx.location()`    | `htmx.ajax()`                     |
| `htmx.logAll()`      | `htmx.config.logAll = true`       |
| `htmx.logNone()`     | `htmx.config.logAll = false`      |

### Methods That Still Work

- `htmx.ajax()` - Make AJAX requests
- `htmx.config` - Configuration object
- `htmx.defineExtension()` - Define extensions
- `htmx.find()` - Find element
- `htmx.findAll()` - Find elements
- `htmx.on()` - Add event listener
- `htmx.onLoad()` - Run code on new content
- `htmx.parseInterval()` - Parse time strings
- `htmx.process()` - Process htmx attributes
- `htmx.swap()` - Swap content
- `htmx.trigger()` - Trigger events

### New Methods

- `htmx.forEvent(eventName, timeout)` - Promise that resolves when event fires
- `htmx.timeout(time)` - Promise that resolves after delay

## New Features

### Morph Swaps

Preserve state when swapping large DOM trees:

```html
<div hx-get="/data" hx-swap="innerMorph">...</div>
<div hx-get="/data" hx-swap="outerMorph">...</div>
```

Uses the idiomorph algorithm. Better than innerHTML for complex UIs.

### SSE Extension Rewritten

The SSE extension has been rewritten to use `fetch()` and `ReadableStream` instead of `EventSource`. This enables
request bodies, custom headers, and all HTTP methods. SSE remains a [core extension](/docs/extensions/overview)
that ships with htmx but requires loading a separate script.

See the [SSE extension documentation](/docs/extensions/sse) for details.

### Modern Swap Names

New aliases for swap styles:

- `before` = `beforebegin`
- `after` = `afterend`
- `prepend` = `afterbegin`
- `append` = `beforeend`

Both old and new names work.

### Partial Tags

Update multiple targets from one response:

```html
<hx-partial hx-target="#messages" hx-swap="beforeend">
    <div>New message</div>
</hx-partial>

<hx-partial hx-target="#count">
    <span>5</span>
</hx-partial>
```

Alternative to out-of-band swaps with explicit targeting.

### Status Code Swaps

Different swap behavior per status code:

```html
<button hx-post="/save"
        hx-status:404="#not-found"
        hx-status:5xx="none">
    Save
</button>
```

Supports exact codes (`404`) and wildcards (`2xx`, `5xx`).

## Extension Changes

Extensions in htmx 4 work differently. They now use event listeners instead of `hx-ext`.

Extensions may need rewrites. See [Extensions documentation](/docs/extensions) for details.

## Migration Notes

Individual documentation pages include migration notes where features changed.

Look for these:

<details class="warning">
<summary>Changes in htmx 4.0</summary>

</details>

## Migration Checklist

1. ☐ Add config options for backward compatibility
2. ☐ Search and rename `hx-disable` → `hx-ignore`
3. ☐ Rename `hx-disabled-elt` → `hx-disable`
4. ☐ Replace removed attributes with alternatives
5. ☐ Find/replace event names in JavaScript
6. ☐ Replace removed API methods with native JS
7. ☐ Update extensions if used
8. ☐ Test error handling (4xx/5xx now swap)
9. ☐ Test attribute inheritance
10. ☐ Test history navigation

## Get Help

- [GitHub Discussions](https://github.com/bigskysoftware/htmx/discussions)
- [Discord](https://htmx.org/discord)
- [Examples](/examples)

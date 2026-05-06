---
title: "Migration"
description: "Migrate from htmx 2.x to htmx 4.x."
---

## Quick Start

There are two major behavioral changes between htmx 2.x and 4.x:

* In htmx 2.0 attribute inheritance is *implicit* by default while in 4.0 it is explicity by default
* In htmx 2.0, `400` and `500` response codes are not swapped by default, whereas in htmx 4.0 these requests will be
  swapped

Add these two config lines to restore htmx 2.x behavior:

```html

<script>
    htmx.config.implicitInheritance = true;
    htmx.config.noSwap = [204, 304, '4xx', '5xx'];
</script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
```

[`implicitInheritance`](/reference/config/htmx-config-implicitInheritance) restores htmx 2's implicit attribute
inheritance. [`noSwap`](/reference/config/htmx-config-noSwap) prevents swapping error responses.

Or load the [`htmx-2-compat`](/extensions/htmx-2-compat) extension, which restores implicit inheritance, old event
names, and previous error-swapping defaults:

```html

<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/htmx-2-compat.js"></script>
```

Most htmx 2 apps should work with either approach. Then migrate incrementally using this guide.

## Upgrade Checker

htmx 4 ships with a command-line tool scans your templates and JS files for htmx 2 code that needs updating. It checks 
for removed attributes, old event names, inheritance patterns, extension changes, etc.

```bash
npx htmx.org@next upgrade-check -- ./path/to/project/root

npx htmx.org@next upgrade-check --ext .vue ./path/to/project/root
```

By default, the tool scans `.html`, `.php`, `.js`, `.ts`, `.jinja`, `.jinja2`, `.j2`, `.erb`, and `.hbs` files.

Output is `file:line` format, clickable in most editors. You can add additional file types with the `--ext` option.

The tool requires Python 3.

## What Changed

### `fetch()` replaces `XMLHttpRequest`

All requests use the native [`fetch()` API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). This cannot be
reverted.

### Explicit inheritance

Add [`:inherited`](/docs/features/attribute-inheritance) to any attribute that should inherit down the DOM tree.

```html
<!-- htmx 2: implicit inheritance -->
<div hx-confirm="Are you sure?">
    <button hx-delete="/item/1">Delete</button>
</div>

<!-- htmx 4: explicit inheritance -->
<div hx-confirm:inherited="Are you sure?">
    <button hx-delete="/item/1">Delete</button>
</div>
```

Works on any attribute: [`hx-boost`](/reference/attributes/hx-boost)`:inherited`, [
`hx-target`](/reference/attributes/hx-target)`:inherited`, [`hx-confirm`](/reference/attributes/hx-confirm)`:inherited`,
etc.

Use `:append` to add to an inherited value instead of replacing it:

```html

<div hx-include:inherited="#global-fields">
    <!-- appends .extra to the inherited value -->
    <form hx-include:inherited:append=".extra">...</form>
</div>
```

Revert: [`htmx.config.implicitInheritance`](/reference/config/htmx-config-implicitInheritance) `= true`

### Error responses swap

htmx 4 swaps all HTTP responses. Only [`204`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/204)
and [`304`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/304) do not swap.

htmx 2 did not swap `4xx` and `5xx` responses. In htmx 4, if your server returns HTML with a `422` or `500`, that HTML
gets swapped into the target. Design your error responses to work as swap content, or use [
`hx-status`](/reference/attributes/hx-status) to control per-code behavior.

Revert: [`htmx.config.noSwap`](/reference/config/htmx-config-noSwap) `= [204, 304, '4xx', '5xx']`

### [`hx-delete`](/reference/attributes/hx-delete) excludes form data

Like [`hx-get`](/reference/attributes/hx-get), [`hx-delete`](/reference/attributes/hx-delete) no longer includes the
enclosing form's inputs.

Fix: add [`hx-include`](/reference/attributes/hx-include)`="closest form"` where needed.

### No history cache

History no longer caches pages in [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
When navigating back, htmx re-fetches the page and swaps it into `<body>`, or into the `[hx-history-elt]` element if
one is present — the same behavior as htmx 2.

Use [`htmx.config.history`](/reference/config/htmx-config-history) `= "reload"` for a full page reload instead. Use
`htmx.config.history = false` to disable.

### OOB swap order

In htmx 2, out-of-band ([`hx-swap-oob`](/reference/attributes/hx-swap-oob)) elements swapped **before** the main
content.

In htmx 4, the main content swaps first. OOB and [`<hx-partial>`](/docs/core-concepts/multi-target-updates#partials-hx-partial) elements swap after (in document order).

This matters if an OOB swap creates or modifies DOM that the main swap depends on. If your app relies on that ordering,
restructure so each swap is independent.

### 60-second timeout

htmx 2 had no timeout (`0`). htmx 4 sets [`defaultTimeout`](/reference/config/htmx-config-defaultTimeout) to `60000`.

Revert: `htmx.config.defaultTimeout = 0`

### Extension loading

Include extension scripts directly. No attribute needed:

```html

<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/sse.js"></script>
```

Restrict which extensions can load:

```html

<meta name="htmx-config" content='{"extensions": "sse, ws"}'>
```

Extension authors use `htmx.registerExtension(name, methodMap)` to register.

See [Extensions documentation](/docs/features/extensions) for details.

## Renames and Removals

### Rename `hx-disable`

Do this **before** upgrading. The name `hx-disable` has been reassigned:

- In htmx 2, `hx-disable` meant "skip htmx processing on this element"
- In htmx 4, that role is [`hx-ignore`](/reference/attributes/hx-ignore)
- The name `hx-disable` now does what `hx-disabled-elt` used to do (disable form elements during requests)

Rename in this order to avoid conflicts:

1. Rename `hx-disable` to [`hx-ignore`](/reference/attributes/hx-ignore)
2. Rename `hx-disabled-elt` to [`hx-disable`](/reference/attributes/hx-disable)

### Removed attributes

| Removed          | Use instead                                                                                       |
|------------------|---------------------------------------------------------------------------------------------------|
| `hx-vars`        | [`hx-vals`](/reference/attributes/hx-vals) with `js:` prefix                                      |
| `hx-params`      | [`htmx:config:request`](/reference/events/htmx-config-request) event                              |
| `hx-prompt`      | [`hx-confirm`](/reference/attributes/hx-confirm) with `js:` prefix                                |
| `hx-ext`         | [Include extension script directly](/docs/features/extensions)                            |
| `hx-disinherit`  | Not needed (inheritance is explicit)                                                              |
| `hx-inherit`     | Not needed (inheritance is explicit)                                                              |
| `hx-request`     | [`hx-config`](/reference/attributes/hx-config)                                                    |
| `hx-history`     | Removed (no [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)) |

### Renamed events

All events follow a new pattern: `htmx:phase:action[:sub-action]`

Most error events are consolidated to [`htmx:error`](/reference/events/htmx-error). HTTP error responses have a dedicated [`htmx:response:error`](/reference/events/htmx-response-error) event.

| htmx 2.x                    | htmx 4.x                                                                          |
|-----------------------------|-----------------------------------------------------------------------------------|
| `htmx:afterOnLoad`          | [`htmx:after:init`](/reference/events/htmx-after-init)                            |
| `htmx:afterProcessNode`     | [`htmx:after:init`](/reference/events/htmx-after-init)                            |
| `htmx:afterRequest`         | [`htmx:after:request`](/reference/events/htmx-after-request)                      |
| `htmx:afterSettle`          | [`htmx:after:swap`](/reference/events/htmx-after-swap)                            |
| `htmx:afterSwap`            | [`htmx:after:swap`](/reference/events/htmx-after-swap)                            |
| `htmx:beforeCleanupElement` | [`htmx:before:cleanup`](/reference/events/htmx-before-cleanup)                    |
| `htmx:beforeHistorySave`    | [`htmx:before:history:update`](/reference/events/htmx-before-history-update)      |
| `htmx:beforeOnLoad`         | [`htmx:before:init`](/reference/events/htmx-before-init)                          |
| `htmx:beforeProcessNode`    | [`htmx:before:process`](/reference/events/htmx-before-process)                    |
| `htmx:beforeRequest`        | [`htmx:before:request`](/reference/events/htmx-before-request)                    |
| `htmx:beforeSwap`           | [`htmx:before:swap`](/reference/events/htmx-before-swap)                          |
| `htmx:configRequest`        | [`htmx:config:request`](/reference/events/htmx-config-request)                    |
| `htmx:historyCacheMiss`     | [`htmx:before:history:restore`](/reference/events/htmx-before-restore-history)    |
| `htmx:historyRestore`       | [`htmx:before:history:restore`](/reference/events/htmx-before-restore-history)    |
| `htmx:load`                 | [`htmx:after:init`](/reference/events/htmx-after-init)                            |
| `htmx:oobAfterSwap`         | [`htmx:after:swap`](/reference/events/htmx-after-swap)                            |
| `htmx:oobBeforeSwap`        | [`htmx:before:swap`](/reference/events/htmx-before-swap)                          |
| `htmx:pushedIntoHistory`    | [`htmx:after:history:push`](/reference/events/htmx-after-push-into-history)       |
| `htmx:replacedInHistory`    | [`htmx:after:history:replace`](/reference/events/htmx-after-replace-into-history) |
| `htmx:responseError`        | [`htmx:response:error`](/reference/events/htmx-response-error)                    |
| `htmx:sendError`            | [`htmx:error`](/reference/events/htmx-error)                                      |
| `htmx:swapError`            | [`htmx:error`](/reference/events/htmx-error)                                      |
| `htmx:targetError`          | [`htmx:error`](/reference/events/htmx-error)                                      |
| `htmx:timeout`              | [`htmx:error`](/reference/events/htmx-error)                                      |

### Removed events

Validation events are removed. Use native browser form validation:

- `htmx:validation:validate`
- `htmx:validation:failed`
- `htmx:validation:halted`

XHR events are removed (htmx uses `fetch()` now):

| Removed              | Use instead                                                      |
|----------------------|------------------------------------------------------------------|
| `htmx:xhr:loadstart` | No replacement                                                   |
| `htmx:xhr:loadend`   | [`htmx:finally:request`](/reference/events/htmx-finally-request) |
| `htmx:xhr:progress`  | No replacement                                                   |
| `htmx:xhr:abort`     | [`htmx:error`](/reference/events/htmx-error)                     |

### Config changes

**Renamed:**

| htmx 2.x                 | htmx 4.x                                                                   |
|--------------------------|----------------------------------------------------------------------------|
| `defaultSwapStyle`       | [`defaultSwap`](/reference/config/htmx-config-defaultSwap)                 |
| `globalViewTransitions`  | [`transitions`](/reference/config/htmx-config-transitions)                 |
| `historyEnabled`         | [`history`](/reference/config/htmx-config-history)                         |
| `includeIndicatorStyles` | [`includeIndicatorCSS`](/reference/config/htmx-config-includeIndicatorCSS) |
| `timeout`                | [`defaultTimeout`](/reference/config/htmx-config-defaultTimeout)           |

**Changed defaults:**

| Config                                                                   | htmx 2           | htmx 4               |
|--------------------------------------------------------------------------|------------------|----------------------|
| [`defaultTimeout`](/reference/config/htmx-config-defaultTimeout)         | `0` (no timeout) | `60000` (60 seconds) |
| [`defaultSettleDelay`](/reference/config/htmx-config-defaultSettleDelay) | `20`             | `1`                  |

**Removed:**

`addedClass`, `allowEval`, `allowNestedOobSwaps`, `allowScriptTags`, `attributesToSettle`, `defaultSwapDelay`,
`disableSelector` (use [`hx-ignore`](/reference/attributes/hx-ignore)), `getCacheBusterParam`, `historyCacheSize`,
`ignoreTitle` (still works per-swap via [`hx-swap`](/reference/attributes/hx-swap)`="... ignoreTitle:true"`),
`inlineStyleNonce` (removed — indicator CSS now uses [Constructable Stylesheets](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet) and does not require a nonce),
`methodsThatUseUrlParams`, `refreshOnHistoryMiss`, `responseHandling` (use [
`hx-status`](/reference/attributes/hx-status) and [`noSwap`](/reference/config/htmx-config-noSwap)), `scrollBehavior`,
`scrollIntoViewOnBoost`, `selfRequestsOnly` (use [`htmx.config.mode`](/reference/config/htmx-config-mode)),
`settlingClass`, `swappingClass`, `triggerSpecsCache`, `useTemplateFragments`, `withCredentials` (use [
`hx-config`](/reference/attributes/hx-config)), `wsBinaryType`, `wsReconnectDelay`

The `htmx-swapping`, `htmx-settling`, and `htmx-added` CSS classes are still applied during swaps. The config keys to
customize their names have been removed.

### Request headers

| htmx 2.x          | htmx 4.x                                                | Notes                                                                  |
|-------------------|---------------------------------------------------------|------------------------------------------------------------------------|
| `HX-Trigger`      | [`HX-Source`](/reference/headers/HX-Source)             | Format changed to `tagName#id` (e.g. `button#submit`)                  |
| `HX-Target`       | [`HX-Target`](/reference/headers/HX-Target)             | Format changed to `tagName#id`                                         |
| `HX-Trigger-Name` | removed                                                 | Use [`HX-Source`](/reference/headers/HX-Source)                        |
| `HX-Prompt`       | removed                                                 | Use [`hx-confirm`](/reference/attributes/hx-confirm) with `js:` prefix |
| *(new)*           | [`HX-Request-Type`](/reference/headers/HX-Request-Type) | `"full"` or `"partial"`                                                |
| *(new)*           | [`Accept`](/reference/headers/Accept)                   | Now explicitly `text/html`                                             |

### Response headers

Removed:

- `HX-Trigger-After-Swap`
- `HX-Trigger-After-Settle`

Use [`HX-Trigger`](/reference/headers/HX-Trigger) or JavaScript instead.

Unchanged: [`HX-Trigger`](/reference/headers/HX-Trigger), [`HX-Location`](/reference/headers/HX-Location), [
`HX-Push-Url`](/reference/headers/HX-Push-Url), [`HX-Redirect`](/reference/headers/HX-Redirect), [
`HX-Refresh`](/reference/headers/HX-Refresh), [`HX-Replace-Url`](/reference/headers/HX-Replace-Url), `HX-Retarget`,
`HX-Reswap`, `HX-Reselect`.

### JavaScript API changes

**Removed methods.** Use native JavaScript:

| htmx 2.x             | Use instead                                                            |
|----------------------|------------------------------------------------------------------------|
| `htmx.addClass()`    | `element.classList.add()`                                              |
| `htmx.removeClass()` | `element.classList.remove()`                                           |
| `htmx.toggleClass()` | `element.classList.toggle()`                                           |
| `htmx.closest()`     | `element.closest()`                                                    |
| `htmx.remove()`      | `element.remove()`                                                     |
| `htmx.off()`         | `removeEventListener()` (`htmx.on()` returns the callback)             |
| `htmx.location()`    | `htmx.ajax()`                                                          |

**Renamed:** `htmx.defineExtension()` is now `htmx.registerExtension()`.

**Still available:** `htmx.ajax()`, `htmx.config`, `htmx.find()`, `htmx.findAll()`, `htmx.logAll()`,
`htmx.logNone()`, `htmx.on()`, `htmx.onLoad()`, `htmx.parseInterval()`, `htmx.process()`, `htmx.swap()`,
`htmx.trigger()`.

Note: `htmx.onLoad()` now listens on [`htmx:after:process`](/reference/events/htmx-after-process), not [
`htmx:after:init`](/reference/events/htmx-after-init).

## What's New

### Attributes

| Attribute                                          | Purpose                                                               |
|----------------------------------------------------|-----------------------------------------------------------------------|
| [`hx-action`](/reference/attributes/hx-action)     | Specify URL (use with [`hx-method`](/reference/attributes/hx-method)) |
| [`hx-method`](/reference/attributes/hx-method)     | Specify HTTP method                                                   |
| [`hx-config`](/reference/attributes/hx-config)     | Per-element request config (JSON or `key:value` syntax)               |
| [`hx-ignore`](/reference/attributes/hx-ignore)     | Disable htmx processing (was `hx-disable`)                            |
| [`hx-validate`](/reference/attributes/hx-validate) | Control form validation behavior                                      |

### [`hx-swap`](/reference/attributes/hx-swap) scroll modifiers

The `show` and `scroll` modifiers no longer support the combined `selector:position` syntax. Use separate keys instead:

```html
<!-- htmx 2 (broken in 4) -->
<div hx-swap="innerHTML show:#other:top"></div>

<!-- htmx 4 -->
<div hx-swap="innerHTML show:top showTarget:#other"></div>
<div hx-swap="innerHTML scroll:bottom scrollTarget:#other"></div>
```

### [`hx-swap`](/reference/attributes/hx-swap) styles

```html

<div hx-get="/data" hx-swap="innerMorph">...</div>
<div hx-get="/data" hx-swap="outerMorph">...</div>
<div hx-get="/text" hx-swap="textContent">...</div>
<div hx-get="/remove" hx-swap="delete">...</div>
```

- `innerMorph` / `outerMorph`: morph swaps using the idiomorph algorithm. Better for preserving state in complex UIs.
- `textContent`: set the target's text content (no HTML parsing).
- `delete`: remove the target element entirely.

New aliases for existing swap styles (both old and new names work):

| New       | Equivalent to |
|-----------|---------------|
| `before`  | `beforebegin` |
| `after`   | `afterend`    |
| `prepend` | `afterbegin`  |
| `append`  | `beforeend`   |

### [Status code swaps](/reference/attributes/hx-status)

Set different swap behavior per HTTP status code:

```html

<form hx-post="/save"
      hx-status:422="swap:innerHTML target:#errors select:#validation-errors"
      hx-status:5xx="swap:none push:false">
    <!-- form fields -->
</form>
```

Available config keys: `swap:`, `target:`, `select:`, `push:`, `replace:`, `transition:`.

Supports exact codes (`404`), single-digit wildcards (`50x`), and range wildcards (`5xx`). Evaluated in order of
specificity.

### `<hx-partial>`

Target multiple elements from one response. An alternative to [`hx-swap-oob`](/reference/attributes/hx-swap-oob) for when you need explicit control over targeting and swap strategy:

```html
<hx-partial hx-target="#messages" hx-swap="beforeend">
    <div>New message</div>
</hx-partial>

<hx-partial hx-target="#count">
    <span>5</span>
</hx-partial>
```

Each `<hx-partial>` specifies its own [`hx-target`](/reference/attributes/hx-target) and [`hx-swap`](/reference/attributes/hx-swap) strategy. See [Multi-Target Updates](/docs/core-concepts/multi-target-updates) for full documentation.

### View transitions

[View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) support is available but
disabled by default.

Enable: [`htmx.config.transitions`](/reference/config/htmx-config-transitions) `= true`

### JSX compatibility

Frameworks that don't support `:` in attribute names can use [
`metaCharacter`](/reference/config/htmx-config-metaCharacter) to replace it:

```js
htmx.config.metaCharacter = "-";
// hx-ws-connect instead of hx-ws:connect
// hx-confirm-inherited instead of hx-confirm:inherited
```

### JavaScript methods

- `htmx.forEvent(...args)`: returns a promise that resolves when any of the supplied events fires or any of the supplied timeouts elapses, whichever happens first. Args are variadic and order-independent: an element is the listener target (last wins, defaults to `document`); a number or interval string (`'500ms'`, `'1s'`) is a timeout; any other string is an event name. Resolves to the event object (event won) or to the original timeout arg (timeout won), so callers can discriminate which input won the race.
- `htmx.logger`: pluggable logging function with signature `(level, message, context?) => void` where `level` is `'event'`, `'warn'`, or `'error'`. The default routes to `console.log`/`warn`/`error` with an `htmx:` prefix; events are silenced unless `htmx.config.logAll` is true, while warnings and errors flow by default. Replace it to ship logs elsewhere: `htmx.logger = (level, msg, ctx) => mySink(level, msg, ctx)`. See **Auto-logged events** below for the convention that drives most output.
- `htmx.logAll()` / `htmx.logNone()`: shortcuts. `logAll()` sets `htmx.config.logAll = true` so event-level output appears. `logNone()` replaces the active logger with a no-op, suppressing everything (including warnings and errors). Useful for tests or production sinks that have their own observability.
- `htmx.nextFrame()`: returns a promise that resolves on the next animation frame
- `htmx.takeClass(target, className, source)`: strips `className` from elements in `source`, then adds it to elements in `target`. `target` and `source` each accept an element, a selector string, or any iterable of elements (NodeList, Array, q() proxy). When `source` is a single element it expands to that element plus its descendants matching `.className`. When `source` is omitted it defaults to `target`'s parent, so `htmx.takeClass(button, 'active')` strips `active` from the surrounding subtree and adds it to button.
- `htmx.timeout(time)`: returns a promise that resolves after a delay (number ms, or interval string `'500ms'`/`'1s'`/`'5m'`)

### Auto-logged events

Internally-dispatched events route through `htmx.logger` as follows:

- If `detail.error` is set on the event, the logger is called at `'error'` level. This covers request failures, hx-on handler exceptions, and other thrown paths. Apps that listen for `htmx:error` get the same data via the event.
- If `detail.warn` is set, the logger is called at `'warn'` level.
- Otherwise, the event is logged at `'event'` level (silent by default; set `htmx.config.logAll = true` to surface).

This restores the htmx 2.x convention: if you want an internal failure path to show up in the console, fire an event with `detail.error` (or `detail.warn`); no per-site `console.error` needed.

### Request context

All events provide a consistent `ctx` object with request/response information.

### Events

| Event                                                                        | Fires                                             |
|------------------------------------------------------------------------------|---------------------------------------------------|
| [`htmx:after:cleanup`](/reference/events/htmx-after-cleanup)                 | After element cleanup                             |
| [`htmx:after:history:update`](/reference/events/htmx-after-history-update)   | After history update                              |
| [`htmx:after:process`](/reference/events/htmx-after-process)                 | After element processing                          |
| [`htmx:before:response`](/reference/events/htmx-before-response)             | Before response body is read (cancellable)        |
| [`htmx:before:settle`](/reference/events/htmx-before-settle)                 | Before settle phase                               |
| [`htmx:after:settle`](/reference/events/htmx-after-settle)                   | After settle phase                                |
| [`htmx:before:viewTransition`](/reference/events/htmx-before-viewTransition) | Before a view transition starts (cancellable)     |
| [`htmx:after:viewTransition`](/reference/events/htmx-after-viewTransition)   | After a view transition completes                 |
| [`htmx:finally:request`](/reference/events/htmx-finally-request)             | Always fires after a request (success or failure) |

### Config keys

| Config                                                                 | Default         | Purpose                                                       |
|------------------------------------------------------------------------|-----------------|---------------------------------------------------------------|
| [`extensions`](/reference/config/htmx-config-extensions)               | `''`            | Comma-separated list of allowed extension names               |
| [`mode`](/reference/config/htmx-config-mode)                           | `'same-origin'` | Fetch mode (replaces `selfRequestsOnly`)                      |
| [`inlineScriptNonce`](/reference/config/htmx-config-inlineScriptNonce) | `''`            | Nonce for inline scripts                                      |
| [`metaCharacter`](/reference/config/htmx-config-metaCharacter)         | `':'`           | Separator character in attribute/event names                  |
| [`morphIgnore`](/reference/config/htmx-config-morphIgnore)             | `''`            | CSS selector for elements to ignore during morph              |
| [`morphScanLimit`](/reference/config/htmx-config-morphScanLimit)       |                 | Max elements to scan during morph matching                    |
| [`morphSkip`](/reference/config/htmx-config-morphSkip)                 | `''`            | CSS selector for elements to skip during morph                |
| [`morphSkipChildren`](/reference/config/htmx-config-morphSkipChildren) | `''`            | CSS selector for elements whose children to skip during morph |

### Core extensions

htmx 4 ships with 9 core extensions. The SSE and WebSocket extensions have been significantly rewritten. See their upgrade guides for details.

| Extension                                                 | Description                                                                          |
|-----------------------------------------------------------|--------------------------------------------------------------------------------------|
| [`alpine-compat`](/extensions/hx-alpine-compat)         | Alpine.js compatibility: initializes Alpine on fragments before swap                 |
| [`browser-indicator`](/extensions/hx-browser-indicator) | Shows the browser's native loading indicator during requests                         |
| [`head-support`](/extensions/hx-head)           | Merges head tag information (styles, etc.) in htmx requests                          |
| [`htmx-2-compat`](/extensions/htmx-2-compat)         | Restores implicit inheritance, old event names, and previous error-swapping defaults |
| [`optimistic`](/extensions/hx-optimistic)               | Shows expected content from a template before the server responds                    |
| [`preload`](/extensions/hx-preload)                     | Triggers requests early (on mouseover/mousedown) for near-instant page loads ([upgrade guide](/extensions/hx-preload#upgrading-from-htmx-2x)) |
| [`sse`](/extensions/hx-sse)                             | Server-Sent Events streaming support ([upgrade guide](/extensions/hx-sse#upgrading-from-htmx-2x)) |
| [`upsert`](/extensions/hx-upsert)                       | Updates existing elements by ID and inserts new ones, preserving unmatched elements  |
| [`ws`](/extensions/hx-ws)                               | Bi-directional WebSocket communication ([upgrade guide](/extensions/hx-ws#upgrading-from-htmx-2x)) |

## Checklist

1. Optionally, add config options or load [`htmx-2-compat`](/extensions/htmx-2-compat) for backward compatibility
2. Run the [upgrade checker](#upgrade-checker) to get a full list of issues
3. Rename `hx-disable` to [`hx-ignore`](/reference/attributes/hx-ignore), then `hx-disabled-elt` to [
   `hx-disable`](/reference/attributes/hx-disable)
4. Replace removed attributes with alternatives
5. Find/replace event names in JavaScript and `hx-on` attributes
6. Replace removed API methods with native JS
7. Update extensions
8. Rename changed config keys
9. Test error handling (4xx/5xx now swap by default)
10. Test attribute inheritance
11. Test history navigation

## Migration Notes

Individual documentation pages include migration notes where features changed.

Look for these:

<details class="warning">
<summary>Changes in htmx 4.0</summary>

</details>

## Get Help

- [GitHub Discussions](https://github.com/bigskysoftware/htmx/discussions)
- [Discord](https://htmx.org/discord)
- [Patterns](/patterns)


## Migrating Your Own Extensions

<!-- Audience shifts here from htmx consumers to extension authors. -->

If you maintain a custom extension written for htmx 2.x, the extension API has changed substantially. The catalog of bundled extensions ([/extensions](/extensions)) has already been ported. This section is for porting your own.

### Quick Start

htmx 4 replaces the callback-based extension API with event-based hooks. Extensions register handlers for lifecycle events instead of implementing callback methods.

The simplest migration: rename `defineExtension` to `registerExtension` and map your callbacks to hooks.

```javascript
// htmx 2.x
htmx.defineExtension('my-ext', {
    onEvent: function(name, evt) {
        if (name === 'htmx:beforeRequest') { /* ... */ }
    }
});

// htmx 4
htmx.registerExtension('my-ext', {
    htmx_before_request: (elt, detail) => { /* ... */ }
});
```

### What Changed

#### No `hx-ext` attribute

Extensions load by including the script. No attribute needed:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/my-extension.js"></script>
```

Restrict which extensions can load:

```html
<meta name="htmx-config" content='{"extensions": "sse, ws"}'>
```

#### Event hooks replace callbacks

Instead of a single `onEvent` callback that switches on event names, each event gets its own hook method. Hook names use underscores where events use colons:

| htmx 2.x event | htmx 4 hook |
|---|---|
| `htmx:configRequest` | `htmx_config_request` |
| `htmx:beforeRequest` | `htmx_before_request` |
| `htmx:afterRequest` | `htmx_after_request` |
| `htmx:beforeSwap` | `htmx_before_swap` |
| `htmx:afterSwap` | `htmx_after_swap` |

All hooks receive `(elt, detail)`. Return `false` to cancel.

#### `handle_swap` is special

Unlike other hooks, `handle_swap` is called directly with positional parameters (no `htmx_` prefix, no detail object):

```javascript
handle_swap: (swapStyle, target, fragment, swapSpec) => {
    if (swapStyle === 'my-swap') {
        target.appendChild(fragment);
        return true;
    }
    return false;
}
```

#### Detail object replaces event properties

All hooks receive `detail.ctx` with full request/response context:

- `detail.ctx.request.body` (FormData in `htmx_config_request`)
- `detail.ctx.request.headers`
- `detail.ctx.response.status`
- `detail.ctx.text` (response body, modifiable in `htmx_after_request`)
- `detail.ctx.target`

#### OOB swap stripping

OOB swaps automatically strip the wrapper element for non-outer swap styles. Name custom swap styles starting with "outer" (e.g., `outerMorph`) to preserve the wrapper.

### Callback Migration Map

#### `init`

```javascript
// htmx 2.x
init: function(api) {
    return null;
}

// htmx 4
init: (internalAPI) => {
    api = internalAPI;
}
```

Store the `internalAPI` reference for use in other hooks. No return value needed.

#### `getSelectors`

Removed. Use `htmx_after_init` to check for attributes:

```javascript
// htmx 2.x
getSelectors: function() {
    return ['[my-custom-attr]'];
},
onEvent: function(name, evt) {
    if (name === 'htmx:afterProcessNode') {
        initializeCustomBehavior(evt.target);
    }
}

// htmx 4
htmx_after_init: (elt) => {
    if (api.attributeValue(elt, 'my-custom-attr')) {
        initializeCustomBehavior(elt);
    }
}
```

#### `onEvent`

Replace with individual hooks:

```javascript
// htmx 2.x
onEvent: function(name, evt) {
    if (name === 'htmx:beforeSwap' && evt.detail.xhr.status !== 200) {
        var target = getRespCodeTarget(evt.detail.requestConfig.elt, evt.detail.xhr.status);
        if (target) {
            evt.detail.shouldSwap = true;
            evt.detail.target = target;
        }
    }
}

// htmx 4
htmx_before_swap: (elt, detail) => {
    if (detail.ctx.response.status !== 200) {
        var target = getRespCodeTarget(elt, detail.ctx.response.status);
        if (target) {
            detail.ctx.target = target;
        }
    }
}
```

#### `transformResponse`

Removed. Modify `detail.ctx.text` in `htmx_after_request`:

```javascript
// htmx 2.x
transformResponse: function(text, xhr, elt) {
    var tpl = htmx.closest(elt, '[mustache-template]');
    if (tpl) {
        var data = JSON.parse(text);
        var template = htmx.find('#' + tpl.getAttribute('mustache-template'));
        return Mustache.render(template.innerHTML, data);
    }
    return text;
}

// htmx 4
htmx_after_request: (elt, detail) => {
    var tpl = elt.closest('[mustache-template]');
    if (tpl) {
        var data = JSON.parse(detail.ctx.text);
        var template = document.querySelector('#' + tpl.getAttribute('mustache-template'));
        detail.ctx.text = Mustache.render(template.innerHTML, data);
    }
}
```

Event flow: response received, `ctx.text` set, `htmx:after:request` fires, `ctx.text` consumed into fragment, `htmx:before:swap`.

#### `encodeParameters`

Removed. Modify `detail.ctx.request.body` in `htmx_config_request`:

```javascript
// htmx 2.x
onEvent: function(name, evt) {
    if (name === 'htmx:configRequest') {
        evt.detail.headers['Content-Type'] = 'application/json';
    }
},
encodeParameters: function(xhr, parameters, elt) {
    var object = {};
    parameters.forEach(function(value, key) {
        if (Object.hasOwn(object, key)) {
            if (!Array.isArray(object[key])) object[key] = [object[key]];
            object[key].push(value);
        } else {
            object[key] = value;
        }
    });
    return JSON.stringify(object);
}

// htmx 4
htmx_config_request: (elt, detail) => {
    detail.ctx.request.headers['Content-Type'] = 'application/json';
    var object = {};
    detail.ctx.request.body.forEach(function(value, key) {
        if (Object.hasOwn(object, key)) {
            if (!Array.isArray(object[key])) object[key] = [object[key]];
            object[key].push(value);
        } else {
            object[key] = value;
        }
    });
    detail.ctx.request.body = JSON.stringify(object);
}
```

`ctx.request.body` is FormData in `htmx_config_request`. It can be replaced with any value (string, JSON, URLSearchParams). For GET/DELETE, body becomes query parameters. For POST/PUT/PATCH, body becomes URLSearchParams (unless multipart).

#### `isInlineSwap` and `handleSwap`

Both replaced by `handle_swap`:

```javascript
// htmx 2.x
isInlineSwap: function(swapStyle) {
    return swapStyle === 'morphdom';
},
handleSwap: function(swapStyle, target, fragment) {
    if (swapStyle === 'morphdom') {
        morphdom(target, fragment.firstElementChild || fragment.firstChild);
        return [target];
    }
}

// htmx 4
handle_swap: (swapStyle, target, fragment) => {
    if (swapStyle === 'morphdom') {
        morphdom(target, fragment.firstElementChild || fragment.firstChild);
        return true;
    }
    return false;
}
```

Return truthy if handled, falsy otherwise. Can return an array of elements for settle tracking.

### Removed Callbacks

| htmx 2.x callback | htmx 4 replacement |
|---|---|
| `getSelectors()` | `htmx_after_init` hook |
| `onEvent(name, evt)` | Individual `htmx_*` hooks |
| `transformResponse(text, xhr, elt)` | `htmx_after_request` hook (modify `detail.ctx.text`) |
| `encodeParameters(xhr, params, elt)` | `htmx_config_request` hook (modify `detail.ctx.request.body`) |
| `isInlineSwap(swapStyle)` | `handle_swap` or name swap style with "outer" prefix |
| `handleSwap(style, target, frag, info)` | `handle_swap(style, target, frag, spec)` |

### Checklist

1. Rename `defineExtension` to `registerExtension`
2. Replace `onEvent` with individual `htmx_*` hooks
3. Replace `transformResponse` with `htmx_after_request`
4. Replace `encodeParameters` with `htmx_config_request`
5. Merge `isInlineSwap` and `handleSwap` into `handle_swap`
6. Replace `getSelectors` with `htmx_after_init`
7. Remove `hx-ext` attributes from HTML
8. Update event names (colons to underscores in hook names)
9. Test custom swap styles with OOB swaps

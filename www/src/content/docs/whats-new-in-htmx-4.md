---
title: "What's New in htmx 4"
description: "An exhaustive catalog of everything that changed in htmx 4.0."
---

## Breaking Changes

### `fetch()` replaces `XMLHttpRequest`

All requests use the native [`fetch()` API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). This cannot be
reverted.

### Explicit inheritance

Add [`:inherited`](#attribute-inheritance) to any attribute that should inherit down the DOM tree.

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
one is present, the same behavior as htmx 2.

Use [`htmx.config.history`](/reference/config/htmx-config-history) `= "reload"` for a full page reload instead. Use
`htmx.config.history = false` to disable.

### OOB swap order

In htmx 2, out-of-band ([`hx-swap-oob`](/reference/attributes/hx-swap-oob)) elements swapped **before** the main
content.

In htmx 4, the main content swaps first. OOB and [`<hx-partial>`](#partials-hx-partial) elements swap after (in document order).

This matters if an OOB swap creates or modifies DOM that the main swap depends on. If your app relies on that ordering,
restructure so each swap is independent.

### `hx-trigger` `queue` modifier removed

The `queue` modifier on [`hx-trigger`](/reference/attributes/hx-trigger) (e.g. `hx-trigger="click queue:all"`) no longer
works. Request queuing is now controlled exclusively by [`hx-sync`](/reference/attributes/hx-sync).

```html
<!-- htmx 2 -->
<div hx-trigger="click queue:all" hx-get="/test">...</div>

<!-- htmx 4: use hx-sync instead -->
<div hx-trigger="click" hx-get="/test" hx-sync="this:queue all">...</div>
```

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

See [Extension System](#extension-system) for details.

## Renames and Removals

### Attributes

Do the `hx-disable` rename **before** upgrading. In htmx 2, `hx-disable` meant "skip htmx processing on this element". In htmx 4, that role is [`hx-ignore`](/reference/attributes/hx-ignore), and `hx-disable` now does what `hx-disabled-elt` used to do.

| htmx 2.x          | htmx 4.x                                                                                           | Type    | Notes                                                                                              |
|-------------------|----------------------------------------------------------------------------------------------------|---------|----------------------------------------------------------------------------------------------------|
| [`hx-disable`](https://htmx.org/attributes/hx-disable/)           | [`hx-ignore`](/reference/attributes/hx-ignore)                                                     | renamed | Rename this first to avoid conflicts.                                                              |
| [`hx-disabled-elt`](https://htmx.org/attributes/hx-disabled-elt/) | [`hx-disable`](/reference/attributes/hx-disable)                                                   | renamed | Rename this after `hx-disable` becomes `hx-ignore`.                                                |
| [`hx-vars`](https://htmx.org/attributes/hx-vars/)                 | [`hx-vals`](/reference/attributes/hx-vals)                                                         | removed | Use the `js:` prefix.                                                                              |
| [`hx-params`](https://htmx.org/attributes/hx-params/)             | [`htmx:config:request`](/reference/events/htmx-config-request)                                     | removed | Configure request parameters in the event.                                                         |
| [`hx-prompt`](https://htmx.org/attributes/hx-prompt/)             | [`hx-prompt` extension](/extensions/hx-prompt)                                                     | removed | You can also use a [one-liner with `hx-on`](/extensions/hx-prompt#without-the-extension).          |
| [`hx-ext`](https://htmx.org/attributes/hx-ext/)                   | —                                                                                                  | removed | [Include extension scripts directly](#extension-system).                                           |
| [`hx-disinherit`](https://htmx.org/attributes/hx-disinherit/)     | —                                                                                                  | removed | Not needed. Inheritance is explicit.                                                               |
| [`hx-inherit`](https://htmx.org/attributes/hx-inherit/)           | —                                                                                                  | removed | Not needed. Inheritance is explicit.                                                               |
| [`hx-request`](https://htmx.org/attributes/hx-request/)           | [`hx-config`](/reference/attributes/hx-config)                                                     | removed | —                                                                                                  |
| [`hx-history`](https://htmx.org/attributes/hx-history/)           | —                                                                                                  | removed | No [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).           |

### Events

All events follow a new pattern: `htmx:phase:action[:sub-action]`. Most error events are consolidated to [`htmx:error`](/reference/events/htmx-error). HTTP error responses use [`htmx:response:error`](/reference/events/htmx-response-error).

| htmx 2.x                    | htmx 4.x                                                                          | Type    | Notes                               |
|-----------------------------|-----------------------------------------------------------------------------------|---------|-------------------------------------|
| `htmx:afterOnLoad`          | [`htmx:after:init`](/reference/events/htmx-after-init)                            | renamed | —                                   |
| `htmx:afterProcessNode`     | [`htmx:after:init`](/reference/events/htmx-after-init)                            | renamed | —                                   |
| `htmx:afterRequest`         | [`htmx:after:request`](/reference/events/htmx-after-request)                      | renamed | —                                   |
| `htmx:afterSettle`          | [`htmx:after:settle`](/reference/events/htmx-after-settle)                        | renamed | —                                   |
| `htmx:afterSwap`            | [`htmx:after:swap`](/reference/events/htmx-after-swap)                            | renamed | —                                   |
| `htmx:beforeCleanupElement` | [`htmx:before:cleanup`](/reference/events/htmx-before-cleanup)                    | renamed | —                                   |
| `htmx:beforeHistorySave`    | [`htmx:before:history:update`](/reference/events/htmx-before-history-update)      | renamed | —                                   |
| `htmx:beforeOnLoad`         | [`htmx:before:init`](/reference/events/htmx-before-init)                          | renamed | —                                   |
| `htmx:beforeProcessNode`    | [`htmx:before:process`](/reference/events/htmx-before-process)                    | renamed | —                                   |
| `htmx:beforeRequest`        | [`htmx:before:request`](/reference/events/htmx-before-request)                    | renamed | —                                   |
| `htmx:beforeSwap`           | [`htmx:before:swap`](/reference/events/htmx-before-swap)                          | renamed | —                                   |
| `htmx:configRequest`        | [`htmx:config:request`](/reference/events/htmx-config-request)                    | renamed | —                                   |
| `htmx:historyCacheMiss`     | [`htmx:before:history:restore`](/reference/events/htmx-before-restore-history)    | renamed | —                                   |
| `htmx:historyRestore`       | [`htmx:before:history:restore`](/reference/events/htmx-before-restore-history)    | renamed | —                                   |
| `htmx:load`                 | [`htmx:after:init`](/reference/events/htmx-after-init)                            | renamed | —                                   |
| `htmx:oobAfterSwap`         | [`htmx:after:swap`](/reference/events/htmx-after-swap)                            | renamed | —                                   |
| `htmx:oobBeforeSwap`        | [`htmx:before:swap`](/reference/events/htmx-before-swap)                          | renamed | —                                   |
| `htmx:pushedIntoHistory`    | [`htmx:after:history:push`](/reference/events/htmx-after-push-into-history)       | renamed | —                                   |
| `htmx:replacedInHistory`    | [`htmx:after:history:replace`](/reference/events/htmx-after-replace-into-history) | renamed | —                                   |
| `htmx:responseError`        | [`htmx:response:error`](/reference/events/htmx-response-error)                    | renamed | HTTP error responses use this event. |
| `htmx:sendError`            | [`htmx:error`](/reference/events/htmx-error)                                      | renamed | —                                   |
| `htmx:swapError`            | [`htmx:error`](/reference/events/htmx-error)                                      | renamed | —                                   |
| `htmx:targetError`          | [`htmx:error`](/reference/events/htmx-error)                                      | renamed | —                                   |
| `htmx:timeout`              | [`htmx:error`](/reference/events/htmx-error)                                      | renamed | —                                   |
| `htmx:validation:validate`  | —                                                                                 | removed | Use native browser form validation.  |
| `htmx:validation:failed`    | —                                                                                 | removed | Use native browser form validation.  |
| `htmx:validation:halted`    | —                                                                                 | removed | Use native browser form validation.  |
| `htmx:xhr:loadstart`        | —                                                                                 | removed | htmx uses `fetch()` now.             |
| `htmx:xhr:loadend`          | [`htmx:finally:request`](/reference/events/htmx-finally-request)                  | removed | htmx uses `fetch()` now.             |
| `htmx:xhr:progress`         | —                                                                                 | removed | htmx uses `fetch()` now.             |
| `htmx:xhr:abort`            | [`htmx:error`](/reference/events/htmx-error)                                      | removed | htmx uses `fetch()` now.             |

### Config

| htmx 2.x                 | htmx 4.x                                                                   | Type            | Notes                                                                                                                                                |
|--------------------------|----------------------------------------------------------------------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `defaultSwapStyle`       | [`defaultSwap`](/reference/config/htmx-config-defaultSwap)                 | renamed         | —                                                                                                                                                    |
| `globalViewTransitions`  | [`transitions`](/reference/config/htmx-config-transitions)                 | renamed         | —                                                                                                                                                    |
| `historyEnabled`         | [`history`](/reference/config/htmx-config-history)                         | renamed         | —                                                                                                                                                    |
| `includeIndicatorStyles` | [`includeIndicatorCSS`](/reference/config/htmx-config-includeIndicatorCSS) | renamed         | —                                                                                                                                                    |
| `timeout`                | [`defaultTimeout`](/reference/config/htmx-config-defaultTimeout)           | renamed         | —                                                                                                                                                    |
| `defaultTimeout`         | `60000`                                                                    | default changed | Was `0` (no timeout).                                                                                                                                |
| `defaultSettleDelay`     | `1`                                                                        | default changed | Was `20`.                                                                                                                                            |
| `addedClass`             | —                                                                          | removed         | The `htmx-added` CSS class is still applied during swaps.                                                                                            |
| `allowEval`              | —                                                                          | removed         | —                                                                                                                                                    |
| `allowNestedOobSwaps`    | —                                                                          | removed         | —                                                                                                                                                    |
| `allowScriptTags`        | —                                                                          | removed         | —                                                                                                                                                    |
| `attributesToSettle`     | —                                                                          | removed         | —                                                                                                                                                    |
| `defaultSwapDelay`       | —                                                                          | removed         | —                                                                                                                                                    |
| `disableSelector`        | [`hx-ignore`](/reference/attributes/hx-ignore)                             | removed         | —                                                                                                                                                    |
| `getCacheBusterParam`    | —                                                                          | removed         | —                                                                                                                                                    |
| `historyCacheSize`       | —                                                                          | removed         | —                                                                                                                                                    |
| `ignoreTitle`            | —                                                                          | removed         | Still works per swap via [`hx-swap`](/reference/attributes/hx-swap)`="... ignoreTitle:true"`.                                                     |
| `inlineStyleNonce`       | —                                                                          | removed         | Indicator CSS now uses [Constructable Stylesheets](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet), so no nonce is needed. |
| `methodsThatUseUrlParams` | —                                                                         | removed         | —                                                                                                                                                    |
| `refreshOnHistoryMiss`   | —                                                                          | removed         | —                                                                                                                                                    |
| `responseHandling`       | [`hx-status`](/reference/attributes/hx-status)                             | removed         | Use with [`noSwap`](/reference/config/htmx-config-noSwap).                                                                                          |
| `scrollBehavior`         | —                                                                          | removed         | —                                                                                                                                                    |
| `scrollIntoViewOnBoost`  | —                                                                          | removed         | —                                                                                                                                                    |
| `selfRequestsOnly`       | [`htmx.config.mode`](/reference/config/htmx-config-mode)                   | removed         | —                                                                                                                                                    |
| `settlingClass`          | —                                                                          | removed         | The `htmx-settling` CSS class is still applied during swaps.                                                                                         |
| `swappingClass`          | —                                                                          | removed         | The `htmx-swapping` CSS class is still applied during swaps.                                                                                         |
| `triggerSpecsCache`      | —                                                                          | removed         | —                                                                                                                                                    |
| `useTemplateFragments`   | —                                                                          | removed         | —                                                                                                                                                    |
| `withCredentials`        | [`hx-config`](/reference/attributes/hx-config)                             | removed         | —                                                                                                                                                    |
| `wsBinaryType`           | —                                                                          | removed         | —                                                                                                                                                    |
| `wsReconnectDelay`       | —                                                                          | removed         | —                                                                                                                                                    |

### Request headers

| htmx 2.x          | htmx 4.x                                                | Type            | Notes                                                 |
|-------------------|---------------------------------------------------------|-----------------|-------------------------------------------------------|
| `HX-Trigger`      | [`HX-Source`](/reference/headers/HX-Source)             | changed format  | Format is `tagName#id`, e.g. `button#submit`.        |
| `HX-Target`       | [`HX-Target`](/reference/headers/HX-Target)             | changed format  | Format is `tagName#id`.                              |
| `HX-Trigger-Name` | [`HX-Source`](/reference/headers/HX-Source)             | removed         | —                                                     |
| `HX-Prompt`       | [`hx-prompt` extension](/extensions/hx-prompt)          | restored by ext | Load the extension.                                   |
| —                 | [`HX-Request-Type`](/reference/headers/HX-Request-Type) | new             | `"full"` or `"partial"`.                          |
| —                 | `Accept`                                                | new             | Core requests send `text/html`; [`hx-sse`](/extensions/hx-sse#request-headers) adds `text/event-stream`. |

### Response headers

| htmx 2.x                 | htmx 4.x                                      | Type      | Notes                           |
|--------------------------|-----------------------------------------------|-----------|---------------------------------|
| `HX-Trigger-After-Swap`  | [`HX-Trigger`](/reference/headers/HX-Trigger) | removed   | You can also use JavaScript.    |
| `HX-Trigger-After-Settle`| [`HX-Trigger`](/reference/headers/HX-Trigger) | removed   | You can also use JavaScript.    |
| `HX-Trigger`             | [`HX-Trigger`](/reference/headers/HX-Trigger) | unchanged | —                               |
| `HX-Location`            | [`HX-Location`](/reference/headers/HX-Location) | unchanged | —                             |
| `HX-Push-Url`            | [`HX-Push-Url`](/reference/headers/HX-Push-Url) | unchanged | —                             |
| `HX-Redirect`            | [`HX-Redirect`](/reference/headers/HX-Redirect) | unchanged | —                             |
| `HX-Refresh`             | [`HX-Refresh`](/reference/headers/HX-Refresh) | unchanged | —                               |
| `HX-Replace-Url`         | [`HX-Replace-Url`](/reference/headers/HX-Replace-Url) | unchanged | —                       |
| `HX-Retarget`            | [`HX-Retarget`](/reference/headers/HX-Retarget) | unchanged | —                             |
| `HX-Reswap`              | [`HX-Reswap`](/reference/headers/HX-Reswap)   | unchanged | —                               |
| `HX-Reselect`            | [`HX-Reselect`](/reference/headers/HX-Reselect) | unchanged | —                             |

### JavaScript API

| htmx 2.x                 | htmx 4.x                      | Type      | Notes                                                                    |
|--------------------------|-------------------------------|-----------|--------------------------------------------------------------------------|
| `htmx.addClass()`        | `element.classList.add()`     | removed   | Use native JavaScript.                                                   |
| `htmx.removeClass()`     | `element.classList.remove()`  | removed   | Use native JavaScript.                                                   |
| `htmx.toggleClass()`     | `element.classList.toggle()`  | removed   | Use native JavaScript.                                                   |
| `htmx.closest()`         | `element.closest()`           | removed   | Use native JavaScript.                                                   |
| `htmx.remove()`          | `element.remove()`            | removed   | Use native JavaScript.                                                   |
| `htmx.off()`             | `removeEventListener()`       | removed   | `htmx.on()` returns the callback.                                        |
| `htmx.location()`        | `htmx.ajax()`                 | removed   | —                                                                        |
| `htmx.defineExtension()` | `htmx.registerExtension()`    | renamed   | —                                                                        |
| `htmx.logAll()`          | `htmx.config.logAll = true`   | removed   | htmx logs via `console.*`.                                               |
| `htmx.logNone()`         | —                             | removed   | —                                                                        |
| `htmx.logger`            | `console.*`                   | removed   | Observability tools capture `console.error`, `console.warn`, and `console.log`. |
| `htmx.onLoad()`          | `htmx.onLoad()`               | changed   | Now listens on [`htmx:after:process`](/reference/events/htmx-after-process), not [`htmx:after:init`](/reference/events/htmx-after-init). |

Still available: `htmx.ajax()`, `htmx.config`, `htmx.find()`, `htmx.findAll()`, `htmx.on()`, `htmx.onLoad()`, `htmx.parseInterval()`, `htmx.process()`, `htmx.swap()`, `htmx.trigger()`.

## What's New

### Attributes

| Attribute                                          | Purpose                                                               |
|----------------------------------------------------|-----------------------------------------------------------------------|
| [`hx-action`](/reference/attributes/hx-action)     | Specify URL, with optional [`hx-method`](/reference/attributes/hx-method). Supports progressive enhancement via native `action`/`method` fallback |
| [`hx-method`](/reference/attributes/hx-method)     | Specify HTTP method (overrides native `method` and `formmethod`)      |
| [`hx-query`](/reference/attributes/hx-query)       | Issue a `QUERY` request, which sends parameters in the body           |
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

Each `<hx-partial>` specifies its own [`hx-target`](/reference/attributes/hx-target) and [`hx-swap`](/reference/attributes/hx-swap) strategy. See [Multi-Target Updates](#multi-target-updates) for full documentation.

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

- `htmx.timeout(time)`: returns a promise that resolves after a delay (number ms, or interval string `'500ms'`/`'1s'`/`'5m'`)

`htmx.takeClass` is **removed** from core. Equivalent functionality is exposed by the `hx-live` extension on the `htmx.live` namespace:

```js
htmx.live.take(target, className, source)   // strip class from `source`, add to `target`
htmx.live.forEvent(...args)                 // race events/timeouts
htmx.live.nextFrame()                       // promise that resolves on next animation frame
htmx.live.q(selector)                       // jQuery-like proxy rooted at documentElement
htmx.live.debounce(ms[, fn])                // global debounce
htmx.live.refresh()                         // recompute every live expression
```

Inside `hx-live`/`hx-on` expression scope these are available unprefixed (`take`, `forEvent`, `nextFrame`, `q`, `debounce`, `toggle`) with the current element used as the implicit context, see the [`hx-live` extension docs](/extensions/hx-live).

### Auto-logged events

Internally-dispatched events route to the console as follows:

- If `detail.error` is set on the event, output goes to `console.error` (the Error instance is inlined first when applicable, so DevTools renders the stack). This covers request failures, hx-on handler exceptions, and other thrown paths. Apps that listen for `htmx:error` get the same data via the event.
- If `detail.warn` is set, output goes to `console.warn`.
- Otherwise, the event is logged at `console.log` (silent by default; set `htmx.config.logAll = true` to surface).

This restores the htmx 2.x convention: if you want an internal failure path to show up in the console, fire an event with `detail.error` (or `detail.warn`); no per-site `console.error` needed.

### Request Context in Events

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
| [`htmx:before:viewTransition`](/reference/events/htmx-before-viewTransition) | Before a view transition starts                   |
| [`htmx:after:viewTransition`](/reference/events/htmx-after-viewTransition)   | After a view transition completes                 |
| [`htmx:finally:request`](/reference/events/htmx-finally-request)             | When request completes, fails, or is cancelled |

### Config keys

| Config                                                                 | Default         | Purpose                                                       |
|------------------------------------------------------------------------|-----------------|---------------------------------------------------------------|
| [`extensions`](/reference/config/htmx-config-extensions)               | `''`            | Comma-separated list of allowed extension names               |
| [`mode`](/reference/config/htmx-config-mode)                           | `'same-origin'` | Fetch mode (replaces `selfRequestsOnly`)                      |
| [`inlineScriptNonce`](/reference/config/htmx-config-inlineScriptNonce) | `''`            | Nonce for inline scripts                                      |
| [`metaCharacter`](/reference/config/htmx-config-metaCharacter)         | `':'`           | Separator character in attribute/event names                  |
| [`morphIgnore`](/reference/config/htmx-config-morphIgnore)             | `["data-htmx-powered"]` | Attribute name prefixes to preserve during morph              |
| [`morphScanLimit`](/reference/config/htmx-config-morphScanLimit)       |                 | Max elements to scan during morph matching                    |
| [`morphSkip`](/reference/config/htmx-config-morphSkip)                 | `'[hx-morph-skip]'`            | CSS selector for elements to skip during morph                |
| [`morphSkipChildren`](/reference/config/htmx-config-morphSkipChildren) | `'[hx-morph-skip-children]'`            | CSS selector for elements whose children to skip during morph |

### Core extensions

htmx 4 ships with 9 core extensions. The SSE and WebSocket extensions have been significantly rewritten. See their upgrade guides for details.

| Extension                                                 | Description                                                                          |
|-----------------------------------------------------------|--------------------------------------------------------------------------------------|
| [`alpine-compat`](/extensions/hx-alpine-compat)         | Alpine.js compatibility: initializes Alpine on fragments before swap                 |
| [`browser-indicator`](/extensions/hx-browser-indicator) | Shows the browser's native loading indicator during requests                         |
| [`head-support`](/extensions/hx-head)           | Merges head tag information (styles, etc.) in htmx requests                          |
| [`htmx-2-compat`](/extensions/htmx-2-compat)         | Restores implicit inheritance, old event names, and previous error-swapping defaults |
| [`pending`](/extensions/hx-pending)               | Shows expected content from a template before the server responds                    |
| [`preload`](/extensions/hx-preload)                     | Triggers requests early (on mouseover/mousedown) for near-instant page loads ([upgrade guide](/extensions/hx-preload#upgrading-from-htmx-2x)) |
| [`sse`](/extensions/hx-sse)                             | Server-Sent Events streaming support ([upgrade guide](/extensions/hx-sse#upgrading-from-htmx-2x)) |
| [`upsert`](/extensions/hx-upsert)                       | Updates existing elements by ID and inserts new ones, preserving unmatched elements  |
| [`ws`](/extensions/hx-ws)                               | Bi-directional WebSocket communication ([upgrade guide](/extensions/hx-ws#upgrading-from-htmx-2x)) |

# Plan: Create htmx.compat.js — Full htmx 2.0 backwards compatibility bridge

## Context

htmx 4.0 has a fundamentally different architecture from 2.0: minimal core + extensions, colon-separated event names, new API surface, `fetch()` instead of XHR, extensions via `htmx.register()` instead of `htmx.defineExtension()`. Users migrating from 2.0 need a drop-in compat layer that lets their existing code work while they gradually migrate.

Additionally, the `htmx:before:settle` / `htmx:after:settle` events are being removed from core (they're empty ceremony — two events back-to-back with zero logic) and moved to this compat layer.

## Files

- **Create** `src/htmx.compat.js` — the compat layer (loaded after core + defaults)
- **Modify** `src/htmx.core.js` — remove settle events from `ajax()`
- **Modify** `REFACTOR.md` — add ADR for settle removal + compat layer

## Changes

### 1. Remove settle from `src/htmx.core.js`

In `ajax()`, remove these two lines after `api.swap(...)`:

```js
if (api.emit(source, 'htmx:before:settle', detail) === false) return
api.emit(source, 'htmx:after:settle', detail)
```

Also remove `htmx:before:settle` / `htmx:after:settle` from the lifecycle comment at the top if referenced.

### 2. Create `src/htmx.compat.js`

Structure follows `htmx.defaults.js` pattern: multiple extensions registered via `htmx.register()`. Each extension is independent and handles one concern.

#### Extension: `compat-settle`

Emit settle events after swap for code that listens to them. Hooks `htmx:after:swap` and emits `htmx:before:settle` / `htmx:after:settle` on the source element via `detail.context.source`.

#### Extension: `compat-events`

Re-emit 4.0 events with their 2.0 camelCase names. The mapping:

| 4.0 Event | 2.0 Event(s) |
|-----------|-------------|
| `htmx:before:init` | `htmx:beforeProcessNode` |
| `htmx:after:init` | `htmx:afterProcessNode`, `htmx:load` |
| `htmx:before:request` | `htmx:beforeRequest`, `htmx:configRequest` |
| `htmx:after:request` | `htmx:afterRequest` |
| `htmx:before:swap` | `htmx:beforeSwap` |
| `htmx:after:swap` | `htmx:afterSwap` |
| `htmx:before:settle` (from compat-settle) | `htmx:beforeSettle` |
| `htmx:after:settle` (from compat-settle) | `htmx:afterSettle` |
| `htmx:before:cleanup` | `htmx:beforeCleanupElement` |
| `htmx:error` | `htmx:sendError`, `htmx:responseError`, `htmx:targetError` (by error.type) |

Uses a helper that dispatches a real DOM CustomEvent with the old name. Gated behind `htmx.config.compat.disableEventAliases !== true` so users can opt out once migrated.

#### Extension: `compat-api`

Adds 2.0 API methods to the `htmx` object during `htmx:boot`:

- `htmx.process(element)` → `htmx.init(element)`
- `htmx.trigger(element, event, detail)` → `htmx.emit(element, event, detail)`
- `htmx.defineExtension(name, ext)` → adapter that converts old extension format (`init`, `onEvent`, `transformResponse`, `isInlineSwap`, `handleSwap`) to the new `{on: {...}}` format
- `htmx.removeExtension(name)` → console.warn (not supported in 4.0)
- `htmx.closest(element, selector)` → `element.closest(selector)`
- `htmx.remove(element)` → `element.remove()`
- `htmx.addClass(element, cls)` → `element.classList.add(cls)`
- `htmx.removeClass(element, cls)` → `element.classList.remove(cls)`
- `htmx.toggleClass(element, cls)` → `element.classList.toggle(cls)`
- `htmx.takeClass(element, cls)` → remove from siblings, add to element
- `htmx.onLoad(fn)` → `htmx.on(document.body, 'htmx:after:init', (e) => fn(e.detail.element))`
- `htmx.parseInterval(str)` → parse duration string (reuse `coerce` logic)
- `htmx.logAll()` / `htmx.logNone()` / `htmx.logger` → event logging toggle

#### Extension: `compat-config`

Maps old config property names to new ones during `htmx:boot`:

- `htmx.config.defaultSwapStyle` ↔ `htmx.config.defaultSwap`
- `htmx.config.timeout` ↔ `htmx.config.requestTimeout`

Uses `Object.defineProperty` with getters/setters so either name works and stays in sync.

#### Extension: `compat-data-attrs`

Wraps `api.attr` during `htmx:boot` to check `data-hx-*` as fallback when `hx-*` returns null. Also updates the init selector to include `data-hx-*` variants via `htmx:before:init:subtree`.

#### Extension: `compat-old-extension-api`

This is part of `compat-api` (the `defineExtension` adapter). The old extension format:

```js
// Old 2.0 format
htmx.defineExtension('my-ext', {
    init: function(api) { ... },
    onEvent: function(name, event) { ... },
    transformResponse: function(text, xhr, elt) { ... },
    handleSwap: function(swapStyle, target, fragment, settleInfo) { ... },
    isInlineSwap: function(swapStyle) { ... }
})
```

The adapter wraps this into the new format by:
- `init` → called during `htmx:boot` with the api object
- `onEvent` → catch-all handler called for every event
- `transformResponse` → hooks `htmx:after:response` to modify `detail.response.text`
- `handleSwap` / `isInlineSwap` → hooks `htmx:before:swap` to set `detail.fn`

### 3. Update `REFACTOR.md`

Add ADR documenting:
- Settle removal from core (moved to compat)
- Compat layer architecture and what it covers

## Registration order

```
compat-settle         (settle events, must come before compat-events)
compat-events         (event name aliases)
compat-config         (config name mapping)
compat-data-attrs     (data-hx-* fallback)
compat-api            (API method aliases + old extension format bridge)
```

## Verification

- Load `test-kernel.html` — should still work (no compat needed for basic test)
- Create a test that uses 2.0-style event listeners (`htmx:beforeRequest`, `htmx:afterSwap`) and verify they fire
- Create a test that uses `htmx.process()`, `htmx.trigger()`, `htmx.defineExtension()` and verify they work
- Verify `data-hx-get` works as an alias for `hx-get`
- Verify `htmx.config.defaultSwapStyle` syncs with `htmx.config.defaultSwap`

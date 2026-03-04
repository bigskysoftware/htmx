# htmx 4.0 — Architecture & Assembly

## Mental Model

```
┌──────────────────────────────────────────────────────┐
│                      KERNEL                           │
│             Lifecycle event machine.                  │
│    Manages elements, emits events, observes DOM.      │
│    Does nothing behavioral on its own.                │
│                                                       │
│    Primitives: emit  on  find  attr                   │
│    Lifecycle:  init  initElement                      │
│                cleanup  cleanupElement  boot           │
│    State:      elements (WeakMap)  config              │
│    Registry:   install(name, {requires, on, wrap})     │
└──────────────────────────────────────────────────────┘
                          │
            extensions plug in via:
            • on: {'event': handler}     hook lifecycle events
            • wrap: {name: fn}           enhance kernel primitives
            • api.xxx = fn               install new capabilities
                          │
┌──────────────────────────────────────────────────────┐
│                    EXTENSIONS                         │
│    Ordered by `requires`.                             │
│                                                       │
│    Layer 1 — Primitive enhancers (wrap api.*):        │
│      parser, extended-selectors, inheritance,         │
│      delay, throttle                                  │
│                                                       │
│    Layer 2 — Capabilities (install new api.*):        │
│      swap, http                                       │
│                                                       │
│    Layer 3 — Defaults & policies:                     │
│      smart-defaults, swap-aliases, timeout            │
│                                                       │
│    Layer 4 — Attribute surfaces (hx-*):               │
│      hx-trigger, hx-get, hx-post, hx-put,            │
│      hx-patch, hx-delete, hx-swap, hx-target,        │
│      hx-boost                                         │
│                                                       │
│    Layer 5 — Public API sugar:                        │
│      public-api                                       │
└──────────────────────────────────────────────────────┘
```

The kernel is a pure lifecycle event machine. It discovers elements in the DOM,
manages their state, emits lifecycle events, and observes mutations. It does not
know about HTTP, attributes, parsing, swapping, or triggers. All behavior is
added by extensions.

Extensions are ordered by their `requires` declarations. The assembler
topologically sorts them.

---

## The Kernel

~370 lines. Pure plumbing.

### Surface

```
State:      elements (WeakMap), config, booted
Registry:   install(name, extension)
Events:     emit(element, eventName, detail)
Primitives: on(element, eventName, handler, options)
            find(selector, options)
            attr(element, name, options)     → always returns string|null
Lifecycle:  init(root)         — walk subtree, initElement each hx-* element
            initElement(el)    — create state, emit before:init / after:init
            cleanup(root)      — walk subtree, cleanupElement each stateful element
            cleanupElement(el) — teardown listeners, delete state
            boot()             — emit htmx:boot, init body, start MutationObserver
```

### Key design decisions

- **`attr()` always returns a string** — it's DOM extraction only. The `parser`
  extension installs `api.parse()` as a separate transformation step. Extensions
  that need parsed attributes compose explicitly: `api.parse(api.attr(el, name), opts)`.
  This keeps the layers clean — `inheritance` can wrap `attr()` and return strings,
  `parser` can wrap `parse()` for dot-path expansion, and they don't fight each other.
- No `swap` — installed by the swap extension
- No `ajax` — installed by the http extension
- No `parse` — installed by the parser extension
- No trigger wiring — extensions wrap `init.execute` during `before:init`

### initElement — minimal

```js
function initElement(element) {
    if (state.elements.has(element)) return
    const detail = {element, init: {execute: null}}
    detail.init.execute = () => {
        state.elements.set(element, {cleanup: []})
    }
    if (canceled(api.emit(element, 'htmx:before:init', detail))) return
    detail.init.execute()
    api.emit(element, 'htmx:after:init', detail)
}
```

Extensions wrap `detail.init.execute` during `before:init` to add trigger
wiring, listener setup, or any other init-time behavior.

### Public API

The kernel returns only what it owns:

```js
return {
    version: '4.0.0',
    config, install, state,
    get init() { return api.init },
    get emit() { return api.emit },
    get on() { return api.on },
    get attr() { return api.attr },
    get find() { return api.find },
}
```

Extensions install additional public API during boot:
- `htmx.swap(...)` — installed by public-api extension
- `htmx.ajax(...)` — installed by public-api extension
- `htmx.parse(...)` — installed by public-api extension

---

## Extension Format

### `install(name, { requires, on, wrap })`

One function to extend htmx. Three declarative keys:

- **`requires`** — dependency list. Extension won't install if deps are missing.
- **`on`** — event handlers. Hook lifecycle events to add behavior.
- **`wrap`** — primitive enhancers. Wrap kernel functions to add capabilities.

```js
htmx.install('extended-selectors', {
    wrap: {
        find: (original, selector, options) => {
            /**
             * [extended-selectors] Named targets (`this`, `body`, `document`,
             * `window`), traversal (`closest`, `next`, `previous`), and scoped
             * search (`find <sel>`) when `options.from` is set.
             *
             * @param {Element} [options.from] - Context element for relative selectors.
             *
             * @returns {Element|Element[]|Window|Document|null}
             *
             * @example find('closest .container', {from: el})
             */
            const el = options?.from
            if (selector === 'this') return el ?? null
            if (selector === 'body') return document.body
            if (selector.startsWith('closest ')) return el?.closest(selector.slice(8))
            // ... more extended selectors ...
            return original(selector, options)
        }
    }
})
```

```js
htmx.install('hx-swap', {
    requires: ['swap', 'parser'],
    on: {
        'htmx:before:swap': (detail, api) => {
            const swapAttr = api.parse(api.attr(detail.element, 'hx-swap'), {as: 'style'})
            if (swapAttr) Object.assign(detail.swap, swapAttr)
        }
    }
})
```

```js
htmx.install('parser', {
    on: {
        'htmx:boot': (detail, api) => {
            api.parse = function parse(text, options) {
                // RelaxedJSON tokenizer + dot-path expansion
                // ...
            }
        }
    }
})
```

The `wrap` key is declarative — the assembler can extract wraps directly from the
install call without scanning boot handler bodies.

### Parameter validation

The assembler validates handler signatures at build time:

- `on` handlers: first param must be `detail` (or `_`), second must be `api` (or `_`)
- `wrap` functions: first param must be `original` (or `_`), rest must match kernel function signature

```
error: extension 'bad-ext' handler for 'htmx:before:init' has invalid parameter names
  --> src/htmx.core.js:3:5
   |
 3 |     (d, a) => {
   |     ^^^^^^
   = help: first parameter 'd' — expected 'detail' (or '_' if unused)
```

---

## Extension Map

### Dependency graph

```
No requires:          parser, swap, extended-selectors, inheritance,
                      delay, throttle

requires [swap]:      http, hx-swap (also parser), hx-target, swap-aliases

requires [http]:      hx-get, hx-post, hx-put, hx-patch, hx-delete,
                      hx-boost, timeout

requires [swap,http]: smart-defaults, public-api

requires [parser]:    hx-trigger
```

### Full extension list

```
EXTENSION             REQUIRES       HOOKS / WRAPS
──────────────────────────────────────────────────────────────────

Layer 1 — Primitive enhancers (wrap kernel functions):

  parser              —              boot: install api.parse

  extended-selectors  —              wrap: find (closest, next, this, ...)

  inheritance         —              boot: config inheritance settings
                                     wrap: attr (ancestor walk, returns string)

  delay               —              wrap: on (debounce via options.delay)

  throttle            —              wrap: on (rate-limit via options.throttle)

Layer 2 — Capabilities (install new functions on api):

  swap                —              boot: install api.swap
                                     emits: before:swap, after:swap

  http                [swap]         boot: install api.ajax
                                     emits: before:request, after:request,
                                            before:response, after:response,
                                            htmx:done, htmx:error, htmx:finally

Layer 3 — Defaults & policies:

  smart-defaults      [swap,http]    boot: config defaultSwap, defaultHeaders
                                     on: before:init (default trigger event)
                                         before:swap (default style)
                                         before:request (default headers)

  swap-aliases        [swap]         on: before:swap (before→beforebegin, ...)

  timeout             [http]         boot: config requestTimeout
                                     on: before:request (AbortSignal.timeout)

Layer 4 — Attribute surfaces (hx-*):

  hx-trigger          [parser]       on: before:init → wire listeners
  hx-get              [http]         on: before:trigger → api.ajax()
  hx-post             [http]         on: before:trigger → api.ajax()
  hx-put              [http]         on: before:trigger → api.ajax()
  hx-patch            [http]         on: before:trigger → api.ajax()
  hx-delete           [http]         on: before:trigger → api.ajax()
  hx-swap             [swap,parser]  on: before:swap → set style
  hx-target           [swap]         on: before:swap → resolve target
  hx-boost            [http]         on: after:walk:init, before:trigger

Layer 5 — Public API sugar:

  public-api          [swap,http]    boot: install htmx.swap, htmx.ajax,
                                           htmx.parse
```

### attr/parse separation

`attr()` always returns strings. Extensions compose explicitly:

```
Layer 0 (kernel):  attr(el, 'hx-swap')           → "innerHTML swap:100ms"
Layer 1 (parser):  parse("innerHTML swap:100ms")  → {style: "innerHTML", swap: 100}

JIT extensions:    api.parse(api.attr(el, 'hx-swap'), {as: 'style'})
```

This means:
- `inheritance` wraps `attr` and returns strings — can safely use `original()`
- `parser` installs `api.parse` — never touches `attr`
- No layering violations, decorators compose cleanly

### Pipeline context — transport-agnostic detail

The pipeline detail is a shared context object. Each transport owns its own
namespace; shared phases (like swap) read their namespace and ignore the rest:

```
HTTP:          {element, request, response, swap: {content, target, style}}
WebSocket:     {element, connection, message, swap: {content, target, style}}
SSE:           {element, source, event, swap: {content, target, style}}
Programmatic:  {element, swap: {content, target, style}}
```

---

## The Assembler

A Rust CLI tool that takes the kernel + extension files and produces a single
assembled JavaScript file.

### CLI

```
htmx build -i <file.js>... [-o output.js] [--watch] [--inline]
```

- `-i` — input files (kernel auto-detected as `*.kernel.js`)
- `-o` — output file (default: stdout)
- `--watch` — rebuild on file changes
- `--inline` — inline wraps and event handlers at call sites

### Two modes

**Simple mode** (default) — smart concatenation:
- Boot handlers injected between `// ── Extensions: Start/End` markers
- Event handlers stay as `install()` calls (runtime linking)
- Each extension in a block-scoped `{ }` wrapper
- Tagged with `// ── [name]` / `// ── [/name]` comments

**Inline mode** (`--inline`) — full inlining:
- `wrap` functions inlined into kernel function bodies
- Event handlers inlined at `api.emit()` call sites
- Boot handlers injected between markers (same as simple)
- JSDoc from extensions merged into kernel function documentation
- Zero `install()` calls in output
- `return false` → `break label` conversion for inlined handlers

### Kernel requirements

The kernel must contain exactly two markers (4-space indented):

```js
    // ── Extensions: Start ────────────────────────────────────────────────────
    // ── Extensions: End ──────────────────────────────────────────────────────
```

Boot handlers are injected between these markers.

### Emit site detection

The assembler scans for `api.emit(element, 'event-name', detail)` patterns in
the kernel source. Event handlers from extensions are matched by event name and
injected at the corresponding emit site.

### JSDoc merging

When the assembler inlines a `wrap` function into a kernel primitive, it merges
the JSDoc. The kernel function's base documentation stays, and each extension's
JSDoc is appended as a tagged section.

**Source — kernel:**

```js
/**
 * Resolve an element reference. Supports CSS selectors and direct
 * Element references. Pass {multiple: true} to get an array.
 *
 * @param {string|Element|null} selector - CSS selector or element.
 * @param {Object} [options]
 * @param {boolean} [options.multiple] - Return array of all matches.
 *
 * @returns {Element|Element[]|null}
 *
 * @example find('#my-element')
 * @example find('.items', {multiple: true})
 */
function find(selector, options) {
    // ... base implementation
}
```

**Source — extension:**

```js
htmx.install('extended-selectors', {
    wrap: {
        find: (original, selector, options) => {
            /**
             * [extended-selectors] Named targets (`this`, `body`, `document`,
             * `window`), traversal (`closest`, `next`, `previous`), and scoped
             * search (`find <sel>`) when `options.from` is set.
             *
             * @param {Element} [options.from] - Context element for relative selectors.
             *
             * @returns {Element|Element[]|Window|Document|null}
             *
             * @example find('closest .container', {from: el})
             * @example find('this', {from: el})
             */
            // ...
        }
    }
})
```

**Assembled output (inline mode):**

The assembler merges JSDoc intelligently:
- **Descriptions** — kernel description first, then extension descriptions as tagged `[name]` sections
- **`@param`** — kernel params first, then extension params tagged with `[name]`
- **`@returns`** — widest type wins; tagged when an extension widens it
- **`@example`** — kernel examples first, then extension examples tagged with `[name]`

```js
/**
 * Resolve an element reference. Supports CSS selectors and direct
 * Element references. Pass {multiple: true} to get an array.
 *
 * [extended-selectors] Named targets (`this`, `body`, `document`,
 * `window`), traversal (`closest`, `next`, `previous`), and scoped
 * search (`find <sel>`) when `options.from` is set.
 *
 * @param {string|Element|null} selector - CSS selector or element.
 * @param {Object} [options]
 * @param {boolean} [options.multiple] - Return array of all matches.
 * @param {Element} [options.from] - [extended-selectors] Context element for relative selectors.
 *
 * @returns {Element|Element[]|Window|Document|null} — includes Window, Document via [extended-selectors]
 *
 * @example find('#my-element')
 * @example find('.items', {multiple: true})
 * @example find('closest .container', {from: el})  // [extended-selectors]
 * @example find('this', {from: el})                // [extended-selectors]
 */
function find(selector, options) {
    // ── [extended-selectors] ─────────────────────────────────────
    // ... inlined wrap code ...
    // ── [/extended-selectors] ────────────────────────────────────

    // ── [base] ──
    // ... original kernel implementation ...
}
```

Multiple wraps stack. For `attr` (wrapped by inheritance only — parser does NOT wrap attr):

```js
/**
 * Read an attribute from an element.
 *
 * [inheritance] Walk up the DOM for inherited attributes.
 * Supports `:inherited` and `:append` suffixes.
 *
 * @param {Element} element
 * @param {string} name
 * @param {Object} [options]
 * @param {boolean} [options.inherit] - [inheritance] Set false to skip inheritance.
 *
 * @returns {string|null}
 */
function attr(element, name, options) {
    // ── [inheritance] ────────────────────────────────────────────
    // ... ancestor walk logic, returns string ...
    // ── [/inheritance] ───────────────────────────────────────────

    // ── [base] ──
    return element.getAttribute(name)
}
```

Similarly for `on` (wrapped by delay, then throttle):

```js
/**
 * Listen for a DOM event. Auto-cleanup when element is removed.
 *
 * [delay] Debounce: when `options.delay` is set, the handler only
 * fires once after the specified quiet period elapses.
 *
 * [throttle] Rate-limit: when `options.throttle` is set, the handler
 * fires at most once per the specified interval.
 *
 * @param {EventTarget} element
 * @param {string} eventName
 * @param {EventListener} handler
 * @param {Object} [options]
 * @param {number} [options.delay] - Debounce delay in ms.
 * @param {number} [options.throttle] - Minimum ms between invocations.
 * @returns {function} unsubscribe callback
 */
function on(element, eventName, handler, options) {
    // ── [delay] ──────────────────────────────────────────────────
    // ... debounce logic ...
    // ── [/delay] ─────────────────────────────────────────────────

    // ── [throttle] ───────────────────────────────────────────────
    // ... rate-limit logic ...
    // ── [/throttle] ──────────────────────────────────────────────

    // ── [base] ──
    element.addEventListener(eventName, handler, options)
    // ...
}
```

### Event handler inlining

For non-boot event handlers, the assembler injects them at the matching
`api.emit()` call site:

```js
function initElement(element) {
    if (state.elements.has(element)) return
    const detail = {element, init: {execute: null}}
    detail.init.execute = () => {
        state.elements.set(element, {cleanup: []})
    }

    // ── [smart-defaults] (before:init) ───────────────────────────
    smart_defaults: {
        // Default trigger based on element type
        // ...
    }
    // ── [/smart-defaults] ────────────────────────────────────────

    // ── [hx-trigger] (before:init) ───────────────────────────────
    hx_trigger: {
        const raw = detail.element.getAttribute('hx-trigger')
        if (!raw) break hx_trigger
        // ... parse trigger attribute, wire listeners ...
    }
    // ── [/hx-trigger] ───────────────────────────────────────────

    api.emit(element, 'htmx:before:init', detail)
    detail.init.execute()
    api.emit(element, 'htmx:after:init', detail)
}
```

The `return false` → `break label` conversion allows inlined handlers to
short-circuit without exiting the enclosing function.

---

## Simple Mode Output

Without `--inline`, the assembler does smart concatenation. Extensions stay as
`install()` calls, block-scoped and tagged:

```js
// htmx 4.0.0 — assembled build
// Extensions: parser, swap, http, ...
var htmx = (function () {
    'use strict'

    // ... kernel code unchanged ...

    const api = { /* ... */ }

    // ── Extensions: Start ────────────────────────────────────────────────

    // ── [parser] ─────────────────────────────────────────────────────
    {
        install('parser', {
            on: {
                'htmx:boot': (detail, api) => {
                    api.parse = function parse(text, options) { /* ... */ }
                }
            }
        })
    }
    // ── [/parser] ────────────────────────────────────────────────────

    // ── [swap] ───────────────────────────────────────────────────────
    {
        install('swap', {
            on: {
                'htmx:boot': (detail, api) => {
                    api.swap = function swap(detail) { /* ... */ }
                }
            }
        })
    }
    // ── [/swap] ──────────────────────────────────────────────────────

    // ... more extensions ...

    // ── Extensions: End ──────────────────────────────────────────────────

    function boot() { /* ... */ }
    // ...
    return { /* ... */ }
})()
```

Simple mode is useful for debugging — install() calls are preserved, extensions
run through the normal event dispatch loop. Inline mode is for production —
zero dispatch overhead, all code inlined.

---

## Dynamic CDN (Future)

The same Rust codebase compiles to WASM for Cloudflare Workers:

```
cdn.htmx.org/4.0/htmx.js                    → standard build (kernel + core)
cdn.htmx.org/4.0/htmx.kernel.js             → bare kernel only
cdn.htmx.org/4.0/htmx.js?include=ws,sse     → standard + extra extensions
cdn.htmx.org/4.0/htmx.js?exclude=boost      → standard minus specific extensions
cdn.htmx.org/4.0/htmx.js?only=http,triggers → kernel + only these extensions
```

No build step. No npm. No bundler. Change a URL, get exactly the htmx you need.


# htmx 4.0 Architectural Decisions

This file captures decisions made during architecture discussions. Written immediately to avoid loss during conversation compaction.

---

## IMPORTANT: Source Code Reference

**DO NOT use the local `src/htmx.js` file for reference.**

It contains a frankenstein of outdated rearchitecture attempts and old htmx 4.0 code. The authoritative htmx 4.0 source is at:
https://raw.githubusercontent.com/bigskysoftware/htmx/refs/heads/four/src/htmx.js

When mapping features, always reference the remote `four` branch, not local files.

---

## Core Philosophy

**Clean DOM, Lazy Evaluation.**

1. Stop storing library state on DOM nodes (`_htmx`)
2. Stop calculating logic before it's needed (no snapshot `ctx`)
3. Rely on live DOM as single source of truth

---

## Technical Pillars

### Pillar A: WeakMap for Internal State

Replace `element._htmx` with a global `WeakMap` keyed by element.

**What lives in WeakMap:**
- `AbortController` (for request queues)
- Event listeners (for cleanup)
- UI counters (indicator request counts)

**Benefits:**
- Zero memory leaks — element removal auto-GCs the WeakMap entry
- Clean DOM — no `_htmx` properties confusing users or breaking `JSON.stringify`

**Access pattern:** `element.state` on wrapped elements (TBD: exact API)

### Pillar B: JIT (Just-In-Time) Evaluation

Do NOT calculate `target`, `swap`, `select` at trigger time. Calculate at response time.

**Flow:**
1. **Trigger:** Create `Request`, attach `sourceElement`, fetch
2. **Response:** Fetch completes
3. **Resolution:** NOW ask the DOM for `hx-target`, `hx-swap`, etc.

**Benefits:**
- Resilience: If DOM changes during flight, we respect current state, not stale snapshot
- Simplicity: No massive state object passed through async gap

---

## Event Model

**7 events total** (simplified from current before:/after: pairs):

| Event | When | Detail |
|-------|------|--------|
| `htmx:init` | Once on startup | `{}` |
| `htmx:activate` | Element processed | `{ source: { element } }` |
| `htmx:deactivate` | Element cleanup | `{ source: { element } }` |
| `htmx:request` | Before fetch | `{ source, request, swap }` |
| `htmx:response` | After fetch | `{ source, request, response, swap }` |
| `htmx:swap` | DOM mutation | `{ source, request, response, swap }` |
| `htmx:done` | Cleanup (finally) | `{ source, request, response, swap, error }` |

**Note:** `source: { element, event }` groups the triggering element and DOM event together.

---

## Event Detail Structure

> **SUPERSEDED** - See SESSION PROGRESS below. We now use `source: { element, event }` at top level.

For request lifecycle events (`htmx:request`, `htmx:response`, `htmx:swap`, `htmx:done`):

```javascript
{
    source: {
        element: WrappedElement,  // the triggering element (wrapped)
        event: Event,             // the DOM event that triggered this
    },
    request: {
        method: 'GET',
        url: '/api/endpoint',
        headers: { ... },
        body: FormData,
        signal: AbortSignal,
        credentials: 'same-origin',
        mode: 'same-origin',
    },
    response: {
        status: 200,
        url: 'https://...',
        headers: { ... },         // lowercase keys
        text: '<div>...</div>',
    },
    swap: {
        method: 'innerHTML',
        target: '#selector',      // resolved JIT at swap time
        modifiers: { ... },
    }
}
```

**Key decision:** `source.element` and `source.event` — grouped together, not inside `request`.

---

## Kernel vs Features

**Kernel owns:**
- Activation/deactivation lifecycle
- Trigger binding (`hx-trigger` parsing)
- Verb extraction (`hx-get`, `hx-post`, etc.)
- Request execution (fetch)
- Swap mechanism and defaults
- Event dispatching

**Features are middleware** — they hook into events and modify `request`/`response`/`swap`.

---

## Config Structure

> **SUPERSEDED** - See SESSION PROGRESS below for latest config structure.

**Kernel config** (`htmx.config`):

```javascript
htmx.config = {
    swap: {
        method: 'innerHTML',
        target: 'this',
        modifiers: {
            swapDelay: 0,
            settleDelay: 20,
            transition: false,
            ignoreTitle: false,
            scroll: null,
            show: null,
            focus: null
        }
    },

    trigger: {
        // NOTE: Still considering better naming
        fallback: 'click',
        elements: {
            'form': 'submit',
            'input:not([type=button])': 'change',
            'select': 'change',
            'textarea': 'change'
        }
    },

    request: {
        timeout: 60000,
        credentials: 'same-origin',
        mode: 'same-origin',
        encoding: null,
        headers: { ... }
    },

    syntax: {
        prefix: 'hx-',
        delimiter: ':',
        format: RelaxedJSON
    },

    inheritance: {
        enable: true,
        mode: 'explicit',       // 'explicit' = require marker, 'implicit' = always inherit
        marker: 'inherited'     // hx-target:inherited opts into inheritance
    },

    security: {
        allowEval: true,
        nonce: null,
        allowOrigins: null,
        trustedTypes: null
    },

    debug: false
}
```

**Removed from kernel config:**
- `morph` → separate feature with its own config
- `classes` → `injectStyles` feature owns these

---

## Single File Constraint

**Non-negotiable:** All code remains in one file: `htmx.js`

No separate directories, no module splitting.

---

## Wrapped Elements

Elements passed to features are wrapped with a Proxy providing:
- `element.attr(name, opts)` — attribute with inheritance
- `element.find(selector)` — extended selector support
- `element.findAll(selector)`
- `element.trigger(event, detail)`
- `element.is(other)` — identity comparison
- `element.native` — access underlying DOM element
- `element.state` — access WeakMap-backed state (TBD)

Wrapping is idempotent — safe to wrap multiple times.

---

## Naming Decisions

> **SUPERSEDED** - See SESSION PROGRESS below.

- ~~Use `sourceElement` not `source` (too ambiguous)~~ → Now use `source: { element, event }`
- ~~Use `request.element` not top-level `element`~~ → Now use `source.element`
- Use `swap.modifiers` namespace to separate "what" from "how" ✓

---

## Utilities Needed

- `htmx.inspect(element)` — debug utility to view WeakMap state (since `_htmx` is gone)

---

---

## SESSION PROGRESS (2026-01-26)

> **Note:** This section contains the latest decisions and supersedes some earlier sections above.
> See ARCHITECTURE_FULL.md for the actual code being developed.

Worked on ARCHITECTURE_FULL.md - rewriting as actual htmx.js code.

### COMPLETED

**Section 1: Core Data Structures**

1. **WeakMap State** - Namespaced structure:
   ```javascript
   state.get(element) = {
       trigger: { listeners, observers, intervals, timeouts },
       request: { queue, controller },
       cache: { etag },
   }
   ```

2. **Config Structure**:
   - `config.request` - credentials, mode, static headers (dynamic headers added by feature)
   - `config.swap` - method, target, modifiers (empty - features define defaults)
   - `config.trigger.events` - uses `*` wildcard for default:
     ```javascript
     events: {
         '*': 'click',
         'form': 'submit',
         'input:not([type=button]), select, textarea': 'change',
     }
     ```
   - `config.trigger.modifiers` - delay, throttle defaults
   - `config.syntax.format` - pluggable parser (RelaxedJSON default)

3. **Parse API**:
   ```javascript
   parse('innerHTML swap:100ms transition:true', 'method')
   // → { method: 'innerHTML', swap: '100ms', transition: 'true' }
   ```

4. **Event Detail** - `source: { element, event }` grouping:
   ```javascript
   {
       source: { element, event },  // Wrapped element + DOM event
       request,
       response,
       swap,
   }
   ```

5. **7 Events** - No before/after pairs:
   - htmx:init, htmx:activate, htmx:deactivate
   - htmx:request, htmx:response, htmx:swap, htmx:done

6. **Request Lifecycle** - Complete `issueRequest()` function with inline examples

### DECIDED BUT NOT YET IMPLEMENTED

1. **element.state proxy** - Wrapped elements should expose `.state`:
   ```javascript
   source.element.state.cache.etag = '...'
   // instead of
   state.get(source.element.native).cache.etag = '...'
   ```

2. **CSS classes out of kernel** - Move to `injectStyles` feature

3. **swap.modifiers empty** - Features define their own defaults, config just allows global overrides

4. **state.get() accepts wrapped or native** - Unwrap automatically if needed

### STILL DISCUSSING

1. **State attribute pattern** - Single `data-htmx="loading requesting"` attribute vs multiple classes. Leaning toward making this a feature, not kernel.

2. **replaceTitle timing** - htmx:swap vs htmx:response for extracting `<title>`

### TODO NEXT SESSION

1. Update Section 1 with `element.state` proxy
2. Remove `classes` from kernel config  
3. Make `swap.modifiers` empty with explanatory comment
4. Update features section to use new event names (htmx:request not htmx:before:request)
5. Design `stateAttribute` feature (if we go that route)
6. Update example features from user's local htmx.js to new patterns

### REFERENCE: User's Feature Examples

See ARCHITECTURE_FULL.md discussion - user shared local features:
- replaceTitle, executeScripts, injectStyles, etag, history
- Good patterns: `enable: true`, state attribute CSS, async history handling

---

## Open Questions

1. ~~Exact API for `element.state` WeakMap access~~ → DECIDED: `source.element.state.cache.etag`
2. ~~Better naming for `trigger.fallback` / `trigger.elements`~~ → DECIDED: `trigger.events` with `*` wildcard
3. ~~Should `htmx:swap` fire before AND after, or split into two events?~~ → DECIDED: Single event, features run in order

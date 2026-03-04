# htmx 4.0 Architecture Proposal

**TL;DR**: I'm proposing a micro-kernel architecture where every htmx behavior (history, boost, headers, etc.) becomes an isolated, disableable, replaceable "feature." This dramatically simplifies the codebase. To get there, we need nested config. I'm asking to ship the nested config shape in beta—the internal refactor can follow incrementally.

---

## The Problem: Scattered Logic

Today, each htmx behavior is hardcoded throughout the codebase. Want to understand how history works? You need to find and trace through multiple methods:

```
htmx.js (current)
├── Line 99:   config.history = true                    // Config here
├── Line 1616: __initHistoryHandling()                  // Init here
├── Line 1620:   window.addEventListener('popstate'...) // Listener here
├── Line 1628: __pushUrlIntoHistory()                   // Push here
├── Line 1634: __replaceUrlInHistory()                  // Replace here
├── Line 1641: __restoreHistory()                       // Restore here
├── Line 1677: __handleHistoryUpdate()                  // Update here
└── ...scattered checks for this.config.history
```

**Same pattern everywhere:**
- Boost logic: `__maybeBoost()`, `__boostedMethodAndAction()`, `__shouldBoost()`, `_htmx.boosted` checks scattered through `__createRequestContext()`
- No-swap-on-204: Logic buried in `__handleStatusCodes()`
- ETag support: Split across request creation and response handling
- Every header (HX-Reswap, HX-Retarget, etc.): Individual handling scattered throughout

**The cost:**
- Hard to understand: "How does X work?" requires grep + tracing
- Hard to modify: Changes touch multiple places
- Hard to disable: Can't turn off history without forking
- Hard to extend: Extensions are second-class citizens with a separate API

---

## The Proposal: Everything is a Feature

```
┌─────────────────────────────────────┐
│              KERNEL                 │
│                                     │
│   • Parse attributes                │
│   • Make requests                   │
│   • Fire events                     │
│   • Execute swaps                   │
│                                     │
└───────────────┬─────────────────────┘
                │
    ┌───────────┼───────────┬───────────┬───────────┐
    ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│history │ │ boost  │ │ etag   │ │headers │ │  ...   │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
                    (features)
```

A **feature** is: config + event handlers. That's it.

---

## Concrete Example: History

### Current Implementation (scattered)

```javascript
// htmx.js lines 1616-1690 (simplified, but this is real code)

__initHistoryHandling() {
    if (!this.config.history) return;
    if (!history.state) {
        history.replaceState({htmx: true}, '', location.pathname + location.search);
    }
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.htmx) {
            this.__restoreHistory();
        }
    });
}

__pushUrlIntoHistory(path) {
    if (!this.config.history) return;
    history.pushState({htmx: true}, '', path);
    this.__trigger(document, "htmx:after:push:into:history", {path});
}

__replaceUrlInHistory(path) {
    if (!this.config.history) return;
    history.replaceState({htmx: true}, '', path);
    this.__trigger(document, "htmx:after:replace:into:history", {path});
}

__restoreHistory(path) {
    path = path || location.pathname + location.search;
    if (this.__trigger(document, "htmx:before:restore:history", {path, cacheMiss: true})) {
        if (this.config.history === "reload") {
            location.reload();
        } else {
            this.ajax('GET', path, {
                target: 'body',
                request: {headers: {'HX-History-Restore-Request': 'true'}}
            });
        }
    }
}

__handleHistoryUpdate(ctx) {
    let {sourceElement, push, replace, hx, response} = ctx;
    // ... 30 more lines of logic
}
```

Plus `config.history` defined elsewhere, plus checks scattered throughout.

### Proposed Implementation (one feature)

```javascript
history: {
    enable: true,
    reload: false,

    on: {
        'htmx:after:init': function() {
            if (!this.config.features.history.enable) return

            // Initialize history state
            if (!history.state) {
                history.replaceState({ htmx: true }, '', location.pathname + location.search)
            }

            // Listen for back/forward
            window.addEventListener('popstate', event => {
                if (!event.state?.htmx) return

                const path = location.pathname + location.search
                this.trigger('htmx:before:history:restore', { path })

                if (this.config.features.history.reload) {
                    location.reload()
                } else {
                    this.ajax('GET', path, {
                        target: 'body',
                        headers: { 'HX-History-Restore-Request': 'true' }
                    })
                }
            })
        },

        'htmx:before:request': function({ request }) {
            // Capture at request time, store on element (survives DOM removal)
            const el = request.element
            el._htmx.historyPush = this.__attr(el, 'hx-push-url')
            el._htmx.historyReplace = this.__attr(el, 'hx-replace-url')
        },

        'htmx:after:swap': function({ request, response }) {
            const push = request.element._htmx.historyPush
            const replace = request.element._htmx.historyReplace

            if (push && push !== 'false') {
                const path = push === 'true' ? response.url : push
                history.pushState({ htmx: true }, '', path)
                this.trigger('htmx:after:history:push', { path })
            }

            if (replace && replace !== 'false') {
                const path = replace === 'true' ? response.url : replace
                history.replaceState({ htmx: true }, '', path)
                this.trigger('htmx:after:history:replace', { path })
            }
        }
    }
}
```

**Everything about history is in one place.**

---

## More Examples

### No-Swap-on-204/304 (currently buried in `__handleStatusCodes`)

```javascript
// Current: logic hidden in __handleStatusCodes(), config.noSwap = [204, 304]

// Proposed:
noSwap: {
    enable: true,
    statusCodes: [204, 304],
    on: {
        'htmx:after:request': ({ response, swap }) => {
            if (this.feature.statusCodes.includes(response.status)) {
                swap.method = 'none'
            }
        }
    }
}
```

### ETag Support (currently split across request/response handling)

```javascript
// Proposed:
etag: {
    enable: true,
    on: {
        'htmx:before:request': ({ request }) => {
            const etag = request.element._htmx?.etag
            if (etag) request.headers['If-None-Match'] = etag
        },
        'htmx:after:request': ({ request, response }) => {
            const etag = response.headers['ETag']
            if (etag) request.element._htmx.etag = etag
        }
    }
}
```

### HX-Reswap Header (currently hardcoded response handling)

```javascript
// Proposed:
applyReswapHeader: {
    enable: true,
    on: {
        'htmx:after:request': ({ response, swap }) => {
            if (response.headers['HX-Reswap']) {
                swap.method = response.headers['HX-Reswap']
            }
        }
    }
}
```

---

## What This Enables

### 1. Disable Anything

```javascript
// Don't want history support?
htmx.config.features.history.enable = false

// Don't want no-swap-on-204/304?
htmx.config.features.noSwap.enable = false

// Don't want ETag handling?
htmx.config.features.etag.enable = false
```

### 2. Configure Anything

```javascript
// Only skip swap on 204, not 304
htmx.config.features.noSwap.statusCodes = [204]

// Use reload instead of AJAX for history restore
htmx.config.features.history.reload = true
```

### 3. Replace Anything

```javascript
// Custom redirect behavior (show modal instead of immediate redirect)
htmx.config.features.applyRedirectHeader = {
    enable: true,
    on: {
        'htmx:after:request': ({ response }) => {
            if (response.headers['HX-Redirect']) {
                showConfirmModal(response.headers['HX-Redirect'])
            }
        }
    }
}
```

### 4. Extensions ARE Features

```javascript
// Adding CSRF protection is just adding a feature
htmx.config.features.csrf = {
    enable: true,
    on: {
        'htmx:before:request': ({ request }) => {
            request.headers['X-CSRF-Token'] =
                document.querySelector('meta[name="csrf-token"]').content
        }
    }
}

// Same pattern as core features. No special extension API.
```

### 5. Self-Documenting Code

Want to know what `noSwap` does? Read the feature. The code IS the documentation.

### 6. Future: Tree-Shakeable Builds

```html
<!-- Full build -->
<script src="htmx.min.js"></script>

<!-- Custom build without history, boost, SSE -->
<script src="htmx.min.js?exclude=history,hx-boost,sse"></script>
```

(Not required for beta. But this architecture makes it possible.)

---

## The Foundation: Nested Config

The features system needs nested config to work. Here's why:

Features hook into **config paths**. `hx-config` overrides **config paths**. If config is flat, there's no coherent structure for features to operate on.

### Current Config (flat, inconsistent)

```javascript
config = {
    history: true,                    // boolean
    defaultSwap: "innerHTML",         // "default" prefix
    defaultTimeout: 60000,            // "default" prefix
    noSwap: [204, 304],              // array, no prefix
    transitions: false,               // no prefix
    indicatorClass: "htmx-indicator", // totally different pattern
}
```

### Proposed Config (nested, consistent)

```javascript
config = {
    swap: {
        method: 'innerHTML',
        target: 'this',
        modifiers: { swapDelay: 0, settleDelay: 20, transition: false }
    },
    request: {
        timeout: 60000,
        credentials: 'same-origin',
        headers: {
            'HX-Request': 'true',
            'HX-Current-URL': () => window.location.href,
            'HX-Source': (ctx) => ctx.element.id || null,
            'HX-Target': (ctx) => ctx.swap.target?.id || null,
        }
    },
    history: {
        enable: true,
        reload: false
    },
    features: {
        noSwap: { enable: true, statusCodes: [204, 304] },
        etag: { enable: true },
        // ...
    }
}
```

### Why Nesting Matters

**`hx-config` becomes universal:**

```html
<!-- Current: hx-config only affects request properties -->
<div hx-config="timeout:5000">

<!-- Proposed: hx-config can set ANY path -->
<div hx-config="swap.method:outerHTML, history.enable:false">

<!-- Disable history for this subtree -->
<div hx-config="features.history.enable:false">
    <a hx-get="/page" hx-push-url="true">...</a>  <!-- history won't fire -->
</div>
```

**Attributes map to config paths:**

| Attribute                       | Config Path                            |
|---------------------------------|----------------------------------------|
| `hx-swap="outerHTML"`           | `swap.method`                          |
| `hx-target="#foo"`              | `swap.target`                          |
| `hx-swap="innerHTML swap:100"` | `swap.method` + `swap.modifiers.swapDelay` |

**The syntax isn't ugly anymore.** With RelaxedJSON:

```html
<!-- Not this -->
<meta name="htmx:config" content='{"swap":{"method":"innerHTML"}}'>

<!-- This -->
<meta name="htmx:config" content="swap.method:innerHTML, history.enable:false">
```

---

## The Ask for Beta

I'm not asking to ship the full micro-kernel in beta. I'm asking to ship the **config shape**—the public API users write against.

### Specific Changes

**Config keys:**

| Current | Proposed |
|---------|----------|
| `defaultSwap` | `swap.method` |
| `defaultTimeout` | `request.timeout` |
| `history` | `history.enable` |
| `noSwap` | `features.noSwap.enable` (statusCodes: [204, 304]) |
| `transitions` | `swap.modifiers.transition` |

**Events (consistent `htmx:phase:action` pattern):**

| Current | Proposed |
|---------|----------|
| `htmx:beforeRequest` | `htmx:before:request` |
| `htmx:afterRequest` | `htmx:after:request` |
| `htmx:beforeSwap` | `htmx:before:swap` |
| `htmx:afterSwap` | `htmx:after:swap` |
| `htmx:beforeProcessNode` | `htmx:before:activate` |
| `htmx:afterProcessNode` | `htmx:after:activate` |

**Methods:**

| Current | Proposed |
|---------|----------|
| `htmx.process(el)` | `htmx.activate(el)` |

---

## The Tradeoff

| If we ship nested config in beta | If we ship flat config in beta |
|----------------------------------|-------------------------------|
| Users learn new config paths | Users keep current paths |
| `hx-config` works for everything | `hx-config` limited to request props |
| Foundation for features system | Features system harder to add later |
| One migration | Two migrations if we refactor later |
| Nested structure to document | Flat structure to document |

---

## What I'm NOT Asking

- **Not asking to delay beta.** The config shape can ship without the full internal refactor.
- **Not asking you to write this.** I'll do the PR.
- **Not asking for immediate approval.** I want your input on whether this direction makes sense.

---

## Questions for You

1. **Does the micro-kernel vision make sense?** Is "everything is a feature" a direction you'd want htmx to go?

2. **Is nested config worth the migration cost?** The main benefit is `hx-config` becoming universal + foundation for features.

3. **Are there specific config keys you'd want to keep flat?** We could potentially hybrid—nest some, keep others flat.

4. **What would you need to see to feel confident?** A working PR? More examples? Specific concerns addressed?

---

## Next Steps (if you're open to this)

1. I can prepare a PR with just the config shape changes (no internal refactor)
2. You review, we iterate on naming/structure
3. Ship in beta
4. I continue the internal refactor incrementally after beta

The key insight: **Public API changes (config shape) and internal refactor are separable.** We can lock the API now and clean up internals later.

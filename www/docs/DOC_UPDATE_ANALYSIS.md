# HTMX 4 Documentation Update Analysis

**Generated:** 2025-10-26
**Purpose:** Comprehensive analysis of documentation updates needed for HTMX 4 migration from HTMX 2.0

---

## Executive Summary

### Major Architectural Changes

1. **Complete Internal Rewrite**: HTMX 4 uses a class-based architecture (`class Htmx`) vs HTMX 2.0's functional/object approach
2. **Event Naming Changes**: Event names have been restructured with more consistent naming patterns
3. **Simplified Core Attributes**: Several attributes have been consolidated or renamed
4. **Request Context Model**: New unified request context (`ctx`) object replacing separate configurations
5. **Removed Features**: Several HTMX 2.0 features have been removed or deprecated

### Documentation Impact

- **Critical Updates Required**: ~60% of documentation needs revision
- **New Sections Needed**: ~15% new content required
- **Deprecated Content**: ~10% needs removal
- **Minor Updates**: ~15% requires minor clarification

---

## Section-by-Section Analysis

### 1. Introduction Section (#introduction)

**Priority:** LOW
**Status:** Minimal changes needed

**Required Changes:**
- Update version number references from 2.0.x to 4.0
- No conceptual changes needed - the core philosophy remains the same

**Action Items:**
- [ ] Update example code if any syntax changes apply
- [ ] Verify all conceptual examples still work

---

### 2. Installing Section (#installing)

**Priority:** CRITICAL
**Status:** Major updates required

**Required Changes:**
```html
<!-- OLD (2.0): -->
<script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.8/dist/htmx.min.js">

<!-- NEW (4.0): -->
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0/dist/htmx.min.js">
```

**Action Items:**
- [ ] Update all CDN links to version 4.0
- [ ] Update npm installation commands to @4.0.0
- [ ] Verify webpack integration still works the same way
- [ ] Update integrity hashes for new version

---

### 3. AJAX Section (#ajax)

**Priority:** MEDIUM
**Status:** Moderate changes needed

**Current Documentation Status:**
- Core AJAX attributes remain unchanged: `hx-get`, `hx-post`, `hx-put`, `hx-patch`, `hx-delete`
- These work identically in HTMX 4

**New in HTMX 4:**
- `hx-action` attribute (alternative to using verb-specific attributes)
- `hx-method` attribute (used with `hx-action`)

**Required Changes:**
Add documentation for new pattern:
```html
<!-- New in HTMX 4: -->
<button hx-action="/api/users" hx-method="post">
    Create User
</button>

<!-- Equivalent to: -->
<button hx-post="/api/users">
    Create User
</button>
```

**Action Items:**
- [ ] Add section explaining `hx-action` + `hx-method` pattern
- [ ] Explain when to use each approach
- [ ] Update examples to show both patterns where appropriate

---

### 4. Triggers Section (#triggers)

**Priority:** HIGH
**Status:** Significant changes needed

**Trigger Parsing Changes:**
- HTMX 4 uses new `__tokenize()` and `__parseTriggerSpecs()` methods
- More robust parsing of complex trigger specifications
- Improved handling of quoted strings in triggers

**No Breaking Changes in Syntax**, but improved behavior:
- Better handling of edge cases
- More consistent parsing of modifiers

**Action Items:**
- [ ] Add note about improved trigger parsing
- [ ] Verify all examples still work (they should)
- [ ] Add examples of complex trigger patterns that now work better

---

### 5. Indicators Section (#indicators)

**Priority:** MEDIUM
**Status:** Attribute name change required

**Breaking Change:**
```html
<!-- HTMX 2.0: -->
<button hx-get="/data" hx-disabled-elt="this">

<!-- HTMX 4: -->
<button hx-get="/data" hx-disable="this">
```

**Required Changes:**
- `hx-disabled-elt` renamed to `hx-disable`
- Functionality remains the same
- Selector syntax unchanged

**Action Items:**
- [ ] **CRITICAL:** Update all references from `hx-disabled-elt` to `hx-disable`
- [ ] Update code examples
- [ ] Add migration note for users upgrading from 2.0

---

### 6. Swapping Section (#swapping)

**Priority:** HIGH
**Status:** New swap modifiers and behavior changes

**New Swap Modifier:**
```html
<!-- New in HTMX 4: -->
<div hx-swap="outerHTML strip:true">
```

The `strip` modifier controls whether outer element is included:
- `strip:true` - swaps only children (strips outer element)
- `strip:false` - includes outer element (default for most swap styles)

**Swap Modifier Changes:**
- `strip` is now available as a modifier
- Auto-applied to certain contexts (template partials)

**Action Items:**
- [ ] Add documentation for `strip:true/false` modifier
- [ ] Update swap modifiers table
- [ ] Explain when strip is automatically applied
- [ ] Add examples showing strip behavior

---

### 7. Out of Band Swaps Section (#oob_swaps)

**Priority:** HIGH
**Status:** Major new feature - Partial/Template system

**New Feature: Partial Elements**
HTMX 4 introduces a `<partial>` element (converted to `<template partial>` internally):

```html
<!-- Response from server: -->
<div>
    Main content here
</div>
<partial hx-target="#sidebar" hx-swap="innerHTML">
    Sidebar content
</partial>
<partial hx-target="#footer">
    Footer content
</partial>
```

**How It Works:**
1. Server can return `<partial>` tags in response
2. HTMX converts them to `<template partial>` internally
3. Each partial targets a specific element
4. Processed similarly to OOB swaps but with cleaner syntax

**Template Partial Processing:**
```javascript
// In extractResponseContent:
response = response.replace(/<partial\b/gi, '<template partial')
                   .replace(/<\/partial>/gi, '</template>');
```

**Action Items:**
- [ ] **NEW SECTION NEEDED:** Document the `<partial>` element system
- [ ] Explain relationship to OOB swaps
- [ ] Show examples of multi-target responses
- [ ] Document `hx-target` and `hx-swap` on partials
- [ ] Explain `strip` behavior with partials
- [ ] Add server-side examples in multiple languages

---

### 8. Parameters Section (#parameters)

**Priority:** MEDIUM
**Status:** Minor changes

**Changes:**
- Core parameter handling unchanged
- `hx-vals` still supported
- `hx-include` still supported

**Removed:**
- **`hx-vars` attribute removed** (was deprecated in 2.0)

**Action Items:**
- [ ] Remove all references to `hx-vars`
- [ ] Update examples that use `hx-vars` to use `hx-vals` instead
- [ ] Add migration note

---

### 9. Confirming Requests Section (#confirming)

**Priority:** MEDIUM
**Status:** Minor API change

**Changes in Confirm Handling:**

```javascript
// HTMX 4 can return a Promise from hx-confirm:
let confirmVal = this.__maybeEvalAttributeValueAsync(elt, 'hx-confirm')
if (confirmVal) {
    if (confirmVal instanceof String) {
        window.confirm(confirmVal)
    } else {
        let result = await confirmVal;
        if (!result) return
    }
}
```

**Action Items:**
- [ ] Update to show Promise-based confirm patterns
- [ ] Add async confirm examples
- [ ] Note the String vs Promise behavior

---

### 10. History Section (#history)

**Priority:** HIGH
**Status:** Event name changes

**Event Name Changes:**
```javascript
// HTMX 2.0:
htmx:beforeHistorySave
htmx:historyRestore
htmx:historyCacheMiss

// HTMX 4:
htmx:before:restore:history
htmx:after:push:into:history
htmx:after:replace:into:history
htmx:before:history:update
htmx:after:history:update
```

**New Structure:**
- More consistent `before:` and `after:` patterns
- More descriptive names (e.g., `push:into:history` vs just `pushUrl`)

**Action Items:**
- [ ] **CRITICAL:** Update all event name references
- [ ] Create event migration table (2.0 → 4.0)
- [ ] Update all code examples
- [ ] Update event listener examples

---

### 11. Requests & Responses Section (#requests)

**Priority:** CRITICAL
**Status:** Major event name changes and new context model

**Event Name Changes:**
```javascript
// HTMX 2.0 → HTMX 4

htmx:configRequest → htmx:config:request
htmx:beforeRequest → htmx:before:request
htmx:afterRequest → htmx:after:request
htmx:beforeSwap → htmx:before:swap
htmx:afterSwap → htmx:after:swap
htmx:beforeOnLoad → htmx:before:init
htmx:load → htmx:after:init
htmx:responseError → htmx:error
htmx:sendError → htmx:error
```

**New Context Object Structure:**
The request configuration is now unified in a `ctx` object:

```javascript
// HTMX 4 context structure:
{
    sourceElement: element,
    sourceEvent: event,
    status: "created", // tracks request lifecycle
    select: "...",
    optimistic: "...",
    request: {
        validate: true/false,
        action: "/url",
        method: "GET",
        headers: {},
        body: FormData,
        form: formElement,
        submitter: submitterElement,
        abort: function,
        // ... other request config
    },
    swapCfg: {
        target: element,
        swap: "innerHTML",
        transition: true/false,
        // ... swap configuration
    },
    response: {
        raw: Response,
        status: 200,
        headers: Headers,
        cancelled: false
    },
    text: "response body",
    partialConfigs: [] // for OOB/partial swaps
}
```

**Status Tracking:**
HTMX 4 tracks request status through lifecycle:
- `"created"` - context created
- `"queued"` - queued due to sync strategy
- `"dropped"` - dropped due to sync strategy
- `"issuing"` - request being issued
- `"response received"` - got response
- `"swapped"` - content swapped
- `"error: <message>"` - error occurred

**Action Items:**
- [ ] **CRITICAL:** Document new event naming convention
- [ ] **CRITICAL:** Create comprehensive event reference table
- [ ] Document new `ctx` object structure
- [ ] Document `status` property and values
- [ ] Update all event listener examples
- [ ] Show how to access new context properties
- [ ] Migration guide for event names

---

### 12. Validation Section (#validation)

**Priority:** MEDIUM
**Status:** Context object changes

**Changes:**
```javascript
// HTMX 2.0:
evt.detail.elt
evt.detail.xhr

// HTMX 4:
evt.detail.cfg // The unified context object
evt.detail.cfg.sourceElement
evt.detail.cfg.request
```

**Validation in Request Context:**
Validation moved to `request.validate`:
```javascript
ctx.request.validate = "true" === this.__attributeValue(
    sourceElement,
    "hx-validate",
    sourceElement.matches('form') ? "true" : "false"
)
```

**Action Items:**
- [ ] Update examples to use `cfg` context
- [ ] Update validation event examples
- [ ] Document accessing validation state via context

---

### 13. Events & Logging Section (#events)

**Priority:** CRITICAL
**Status:** Complete event name overhaul

**New Event Naming Convention:**
HTMX 4 uses consistent `category:phase:action` pattern:

```javascript
// Lifecycle events:
htmx:before:init
htmx:after:init
htmx:before:cleanup
htmx:after:cleanup

// Request events:
htmx:config:request
htmx:before:request
htmx:after:request
htmx:finally:request

// Swap events:
htmx:before:swap
htmx:before:main:swap
htmx:before:oob:swap
htmx:before:partial:swap
htmx:after:swap
htmx:after:main:swap
htmx:after:oob:swap
htmx:after:partial:swap

// History events:
htmx:before:restore:history
htmx:before:history:update
htmx:after:history:update
htmx:after:push:into:history
htmx:after:replace:into:history
```

**Event Detail Changes:**
All events now provide `{cfg: ctx}` where `ctx` is the unified context object.

**Action Items:**
- [ ] **CRITICAL:** Create complete event reference section
- [ ] Document new naming convention
- [ ] Provide HTMX 2.0 → 4.0 event migration table
- [ ] Update all event listener examples
- [ ] Document event detail structure changes
- [ ] Add section on event.detail.cfg

---

### 14. Configuration Section (#config)

**Priority:** HIGH
**Status:** Some config options changed/removed

**Removed Configuration Options:**
```javascript
// These are no longer in HTMX 4:
useTemplateFragments  // Removed
wsReconnectDelay      // WebSocket extension only
wsBinaryType          // WebSocket extension only
```

**New Configuration Options:**
```javascript
htmx.config = {
    // ... existing options ...

    // HTMX 4 specific:
    logAll: false,  // New: log all events
    viewTransitions: true,  // Renamed from globalViewTransitions
    selfRequestsOnly: true,  // Enhanced security
    defaultTimeout: 60000   // New default timeout
}
```

**Config Meta Tag:**
```html
<!-- HTMX 4 uses htmx:config: -->
<meta name="htmx:config" content='{"logAll": true}'>
```

**Action Items:**
- [ ] Remove documentation for deleted config options
- [ ] Document new config options
- [ ] Update config table with 4.0 options
- [ ] Note `viewTransitions` rename
- [ ] Update meta tag examples

---

### 15. Boosting Section (#boosting)

**Priority:** MEDIUM
**Status:** Internal changes, external API same

**Implementation Changes:**
```javascript
// HTMX 4 tracks boosting with internal flag:
elt.__htmx = {
    eventHandler: this.__createHtmxEventHandler(elt),
    requests: [],
    boosted: true  // New flag
}
```

**Behavior:**
- `hx-boost` works identically
- Better integration with request context
- More reliable history handling

**Action Items:**
- [ ] Verify all examples still work
- [ ] No documentation changes needed (internal only)

---

### 16. Extensions Section (#extensions)

**Priority:** HIGH
**Status:** Extension API likely changed

**Likely Changes:**
- Extension hooks may need updates for class-based architecture
- Event name changes affect extension event listeners
- Internal API changes may break extensions

**Action Items:**
- [ ] Review extension building guide
- [ ] Update extension API documentation
- [ ] Test all core extensions with HTMX 4
- [ ] Create extension migration guide
- [ ] Update extension examples

---

### 17. Security Section (#security)

**Priority:** HIGH
**Status:** New security features

**New Security Features:**

**`hx-disable` for security:**
```html
<!-- Disable htmx processing in user content: -->
<div hx-disable>
    <%= raw(user_content) %>
</div>
```

**Enhanced `selfRequestsOnly`:**
```javascript
// HTMX 4 enforces same-origin by default:
htmx.config.selfRequestsOnly = true

// Request construction:
{
    ...(this.config.selfRequestsOnly && {mode: "same-origin"})
}
```

**Action Items:**
- [ ] Document `hx-disable` security usage
- [ ] Emphasize `selfRequestsOnly` default
- [ ] Update CSP examples
- [ ] Add security best practices for HTMX 4

---

### 18. Scripting Section (#scripting)

**Priority:** MEDIUM
**Status:** `hx-on` changes

**Changes:**
The `hx-on:*` attribute system works the same, but events have new names:

```html
<!-- Update event names in hx-on: -->
<button hx-post="/example"
        hx-on:htmx:config:request="event.detail.cfg.request.headers['X-Custom'] = 'value'">
    Post Me!
</button>
```

**Action Items:**
- [ ] Update `hx-on` examples with new event names
- [ ] Show accessing `event.detail.cfg` instead of `event.detail`
- [ ] Update event listener examples

---

### 19. Web Sockets & SSE Section (#websockets-and-sse)

**Priority:** LOW
**Status:** Extensions still work (with updates)

**Note:** WebSockets and SSE remain extension-based. Extension compatibility needs verification.

**HTMX 4 includes SSE config:**
```javascript
this.config = {
    sse: false,
    sseUrl: "/events",
    // ...
}
```

**Built-in SSE Support (New?):**
```javascript
__maybeEstablishSSEConnection() {
    if (this.config.sse) {
        this.__eventSource = new EventSource(this.config.sseUrl);
        this.__eventSource.onmessage = async (event) => {
            let cfg = {swapCfg: {swap: 'innerHTML'}};
            this.extractResponseContent(event.data, cfg);
            // ... process partials
        };
    }
}
```

**Action Items:**
- [ ] Verify if SSE is now built-in or still extension-based
- [ ] Update extension compatibility notes
- [ ] Test WebSocket extension with HTMX 4

---

### 20. Synchronization Section (#synchronization)

**Priority:** MEDIUM
**Status:** Enhanced with status tracking

**New Queue Status:**
```javascript
class RequestQueue {
    shouldIssueRequest(ctx, queueStrategy) {
        // Sets ctx.status:
        ctx.status = "queued";
        ctx.status = "dropped";
        // ...
    }
}
```

**Sync Strategies:**
- Same strategies as HTMX 2.0
- Better status tracking
- More predictable behavior

**Action Items:**
- [ ] Verify examples still work
- [ ] Add note about status tracking
- [ ] Update any implementation details

---

## New Sections Needed

### 1. Partial Elements Section

**Priority:** CRITICAL
**Location:** After "Out of Band Swaps"

**Content Needed:**
```markdown
## Partial Elements (#partials)

HTMX 4 introduces `<partial>` elements for cleaner multi-target responses.

### Basic Usage
[Examples]

### Partial vs OOB Swaps
[Comparison]

### Server-Side Implementation
[Examples in different languages]
```

---

### 2. Request Context Section

**Priority:** HIGH
**Location:** In "Requests & Responses"

**Content Needed:**
```markdown
## Request Context Object (#request-context)

HTMX 4 uses a unified context object throughout the request lifecycle.

### Context Structure
[Full object reference]

### Accessing Context in Events
[Examples]

### Status Values
[List and meanings]
```

---

### 3. Event Reference Section

**Priority:** CRITICAL
**Location:** In "Events & Logging"

**Content Needed:**
```markdown
## HTMX 4 Event Reference (#event-reference)

### Complete Event List
[Table with all events]

### Event Naming Convention
[Explanation of category:phase:action pattern]

### Event Detail Structure
[What's in event.detail]

### Migration from HTMX 2.0
[Side-by-side comparison table]
```

---

### 4. Migration Guide Section

**Priority:** CRITICAL
**Location:** After "Introduction", before "Installing"

**Content Needed:**
```markdown
## HTMX 2.0 to 4.0 Migration Guide (#migration-4)

### Breaking Changes
- Attribute renames
- Event name changes
- Removed features

### Updated Behavior
- Enhanced features
- New capabilities

### Migration Checklist
- Step-by-step upgrade process
```

---

## Deprecated/Removed Features

### Features Removed in HTMX 4

1. **`hx-vars` attribute** - Use `hx-vals` instead
2. **`hx-disabled-elt` attribute** - Renamed to `hx-disable`
3. **Some config options** - See config section above

### Features Likely Deprecated (Need Verification)

1. **`hx-prompt` attribute** - Not seen in current code
2. **`hx-params` attribute** - Not seen in current code
3. **Response handling config structure** - May be changed

**Action Items:**
- [ ] Verify each deprecated feature
- [ ] Create deprecation notice section
- [ ] Provide migration path for each

---

## Priority Action Items Summary

### Immediate (Critical)

1. **Update all event names** throughout documentation
2. **Create event migration table** (2.0 → 4.0)
3. **Document `hx-disable`** (renamed from `hx-disabled-elt`)
4. **Create Partial Elements section**
5. **Create Request Context documentation**
6. **Update all CDN/install links** to version 4.0
7. **Create Migration Guide section**

### High Priority

1. **Update swap modifiers** (add `strip`)
2. **Document new event naming convention**
3. **Update configuration reference**
4. **Update extension documentation**
5. **Update security section**
6. **Verify and update `hx-confirm` async behavior**

### Medium Priority

1. **Update scripting examples** with new event names
2. **Update validation examples** with context object
3. **Document `hx-action` + `hx-method` pattern**
4. **Update boosting internal notes**
5. **Verify SSE/WebSocket compatibility**

### Low Priority

1. **Update introduction examples** (if needed)
2. **Polish existing examples** for clarity
3. **Add more advanced examples**
4. **Update troubleshooting guides**

---

## Verification Checklist

- [ ] All event names updated
- [ ] All attribute names updated
- [ ] All code examples tested with HTMX 4
- [ ] All config options verified
- [ ] Extension compatibility verified
- [ ] Migration guide complete
- [ ] All CDN links updated
- [ ] All cross-references updated
- [ ] All examples runnable
- [ ] Security section reviewed

---

## Notes for Documentation Writers

### Testing Approach
1. Set up HTMX 4 test environment
2. Run through each example in documentation
3. Update examples that don't work
4. Note any behavior changes

### Style Guidelines
- Use consistent `htmx:` prefix for all events
- Always show `event.detail.cfg` in event examples
- Highlight breaking changes clearly
- Provide migration snippets for changed features

### Cross-Reference Updates
When updating sections, check:
- Links to other documentation sections
- Links to attribute pages
- Links to event reference
- External blog posts/essays that reference HTMX

---

## Appendix: Complete Event Name Comparison

| HTMX 2.0 Event | HTMX 4 Event | Breaking? |
|----------------|--------------|-----------|
| `htmx:abort` | `htmx:abort` | No |
| `htmx:afterOnLoad` | `htmx:after:init` | **Yes** |
| `htmx:afterProcessNode` | `htmx:after:init` | **Yes** |
| `htmx:afterRequest` | `htmx:after:request` | **Yes** |
| `htmx:afterSettle` | `htmx:after:swap` | **Yes** |
| `htmx:afterSwap` | `htmx:after:swap` | **Yes** |
| `htmx:beforeCleanupElement` | `htmx:before:cleanup` | **Yes** |
| `htmx:beforeOnLoad` | `htmx:before:init` | **Yes** |
| `htmx:beforeProcessNode` | `htmx:before:init` | **Yes** |
| `htmx:beforeRequest` | `htmx:before:request` | **Yes** |
| `htmx:beforeSwap` | `htmx:before:swap` | **Yes** |
| `htmx:beforeTransition` | `htmx:before:transition` | Minor |
| `htmx:configRequest` | `htmx:config:request` | **Yes** |
| `htmx:confirm` | `htmx:confirm` | No |
| `htmx:historyCacheMiss` | `htmx:before:restore:history` | **Yes** |
| `htmx:historyCacheError` | `htmx:error` | **Yes** |
| `htmx:historyRestore` | `htmx:after:restore:history` | **Yes** |
| `htmx:beforeHistorySave` | `htmx:before:history:update` | **Yes** |
| `htmx:load` | `htmx:after:init` | **Yes** |
| `htmx:noSSESourceError` | `htmx:error` | **Yes** |
| `htmx:oobAfterSwap` | `htmx:after:oob:swap` | **Yes** |
| `htmx:oobBeforeSwap` | `htmx:before:oob:swap` | **Yes** |
| `htmx:oobErrorNoTarget` | `htmx:error` | **Yes** |
| `htmx:onLoadError` | `htmx:error` | **Yes** |
| `htmx:prompt` | `htmx:prompt` | No |
| `htmx:pushedIntoHistory` | `htmx:after:push:into:history` | **Yes** |
| `htmx:replacedInHistory` | `htmx:after:replace:into:history` | **Yes** |
| `htmx:responseError` | `htmx:error` | **Yes** |
| `htmx:sendError` | `htmx:error` | **Yes** |
| `htmx:sseError` | `htmx:error` | **Yes** |
| `htmx:swapError` | `htmx:error` | **Yes** |
| `htmx:targetError` | `htmx:error` | **Yes** |
| `htmx:timeout` | `htmx:error` | **Yes** |
| `htmx:trigger` | `htmx:trigger` | No |
| `htmx:validateUrl` | `htmx:validate:url` | Minor |
| `htmx:validation:validate` | `htmx:validation:validate` | No |
| `htmx:validation:failed` | `htmx:validation:failed` | No |
| `htmx:validation:halted` | `htmx:validation:halted` | No |
| `htmx:xhr:abort` | `htmx:abort` | **Yes** |
| `htmx:xhr:loadend` | `htmx:after:request` | **Yes** |
| `htmx:xhr:loadstart` | `htmx:before:request` | **Yes** |
| `htmx:xhr:progress` | `htmx:xhr:progress` | No |

**New Events in HTMX 4:**
- `htmx:before:main:swap` - Before main content swap
- `htmx:after:main:swap` - After main content swap
- `htmx:before:partial:swap` - Before partial swap
- `htmx:after:partial:swap` - After partial swap
- `htmx:finally:request` - Finally block for requests

---

**End of Analysis**

---
name: htmx-upgrade-from-htmx2
description: Use when helping a user upgrade or migrate their codebase from htmx 2.x to htmx 4.x. Covers attribute renames, event name changes, config updates, header changes, extension migration, and step-by-step upgrade workflow.
---

# Upgrading from htmx 2 to htmx 4

htmx 4 is a ground-up rewrite. This guide covers the practical steps to migrate a codebase.

## Instructions for Claude

When helping with an htmx 2 → 4 upgrade:

1. Search the codebase for all htmx usage: `hx-` attributes, `data-hx-` attributes, `htmx:` event
   listeners, `htmx.` API calls, and server-side `HX-` header handling
2. Identify the scope: how many files, how complex the usage
3. Work through the steps below in order, making changes file by file
4. Pay special attention to the hx-disable/hx-ignore rename order (Step 1)
5. For attribute inheritance (Step 3), use codebase analysis to find likely-inherited attributes
   rather than blindly adding `:inherited` everywhere — see the detailed instructions in that step
6. Check server-side code for header handling changes (often in middleware or base controllers)
7. Check for custom extensions — these need a full rewrite

## Step 1: Attribute Renames

Search and replace across the codebase. **Order matters for hx-disable.**

```
# IMPORTANT: Do hx-disable FIRST (it means something different in htmx 2 vs 4)
# In htmx 2, hx-disable stops htmx processing. In htmx 4, hx-ignore does that.
hx-disable  →  hx-ignore          (htmx 2's "disable htmx processing")

# Now safe to rename hx-disabled-elt
hx-disabled-elt  →  hx-disable    (htmx 2's "disable elements during request")
```

## Step 2: Remove Deleted Attributes

| Find                  | Replace with                                                |
|-----------------------|-------------------------------------------------------------|
| `hx-vars='...'`       | `hx-vals='js:...'` (wrap value in `js:` prefix)             |
| `hx-params="..."`     | Remove; use `htmx:config:request` event to filter params    |
| `hx-prompt="..."`     | `hx-confirm="js:myAsyncPromptFn()"` (write a JS function)   |
| `hx-ext="..."`        | Remove (just including the extension script is enough)      |
| `hx-disinherit="..."` | Remove (inheritance is explicit by default)                 |
| `hx-inherit="..."`    | Remove (use `:inherited` modifier on individual attributes) |
| `hx-request='...'`    | `hx-config='...'` (same JSON format)                        |
| `hx-history="false"`  | Remove (history no longer uses localStorage)                |
| `hx-history-elt`      | Remove (history uses target element)                        |

## Step 3: Update Attribute Inheritance

In htmx 2, all attributes inherited implicitly from parent elements. In htmx 4, inheritance must
be explicit using the `:inherited` modifier.

### How to find inherited attributes

**Do not blindly add `:inherited` to everything.** Instead, analyze the codebase to find attributes
that are actually being inherited. Look for this pattern: a parent element has an htmx attribute,
and child/descendant elements rely on it without declaring it themselves.

Common attributes that are frequently inherited:

- **`hx-target`** — very common. Look for a container with `hx-target` and multiple child elements
  with `hx-get`/`hx-post`/etc. that don't have their own `hx-target`
- **`hx-include`** — common in form-heavy UIs where a parent sets a shared include
- **`hx-swap`** — when a group of elements should all swap the same way
- **`hx-boost`** — typically set on a parent `<div>` or `<body>` to boost all links within
- **`hx-confirm`** — set on a container to confirm all actions within it
- **`hx-headers`** — set on a parent to attach auth tokens or CSRF headers to all requests within
- **`hx-indicator`** — set on a parent to share a loading indicator
- **`hx-sync`** — set on a parent to coordinate request timing for children
- **`hx-config`** — set on a parent to configure timeouts, etc. for children
- **`hx-encoding`** — set on a parent for multipart encoding across children
- **`hx-validate`** — set on a parent to enable validation for all children

### What to search for

For each inheritable attribute, search for elements that have the attribute but **don't** have
their own `hx-get`, `hx-post`, `hx-put`, `hx-patch`, or `hx-delete`. These are likely
inheritance parents. Add `:inherited` to them:

```html
<!-- htmx 2 -->
<div hx-target="#output" hx-headers='{"X-Token":"abc"}'>
    <button hx-get="/items">Load</button>
    <button hx-delete="/item/1">Delete</button>
</div>

<!-- htmx 4 -->
<div hx-target:inherited="#output" hx-headers:inherited='{"X-Token":"abc"}'>
    <button hx-get="/items">Load</button>
    <button hx-delete="/item/1">Delete</button>
</div>
```

For `hx-boost`, it is almost always inherited — a `hx-boost="true"` on a non-link, non-form
element is always meant for its descendants.

## Step 4: Update `data-hx-*` Attributes

In htmx 2, both `hx-get` and `data-hx-get` worked. In htmx 4, only `hx-*` works by default.

Option A: Replace all `data-hx-` with `hx-`:

```
data-hx-get    →  hx-get
data-hx-post   →  hx-post
data-hx-target →  hx-target
(etc.)
```

Option B: Set the prefix config:

```html
<meta name="htmx-config" content='{"prefix": "data-hx-"}'>
```

Note: with a custom prefix, ALL attributes must use it.

## Step 5: Update Event Listeners

htmx 2 uses camelCase event names. htmx 4 uses colon-separated names.

**In JavaScript:**

| Find                        | Replace                           |
|-----------------------------|-----------------------------------|
| `htmx:configRequest`        | `htmx:config:request`             |
| `htmx:beforeRequest`        | `htmx:before:request`             |
| `htmx:afterRequest`         | `htmx:after:request`              |
| `htmx:beforeSwap`           | `htmx:before:swap`                |
| `htmx:afterSwap`            | `htmx:after:swap`                 |
| `htmx:afterSettle`          | `htmx:after:swap`                 |
| `htmx:beforeSend`           | `htmx:before:request`             |
| `htmx:load`                 | `htmx:after:init`                 |
| `htmx:beforeOnLoad`         | `htmx:before:init`                |
| `htmx:afterOnLoad`          | `htmx:after:init`                 |
| `htmx:beforeProcessNode`    | `htmx:before:process`             |
| `htmx:afterProcessNode`     | `htmx:after:init`                 |
| `htmx:beforeCleanupElement` | `htmx:before:cleanup`             |
| `htmx:beforeHistorySave`    | `htmx:before:history:update`      |
| `htmx:beforeHistoryUpdate`  | `htmx:before:history:update`      |
| `htmx:historyCacheMiss`     | `htmx:before:history:restore`     |
| `htmx:historyRestore`       | `htmx:before:history:restore`     |
| `htmx:pushedIntoHistory`    | `htmx:after:history:push`         |
| `htmx:replacedInHistory`    | `htmx:after:history:replace`      |
| `htmx:beforeTransition`     | `htmx:before:viewTransition`      |
| `htmx:oobBeforeSwap`        | `htmx:before:swap`                |
| `htmx:oobAfterSwap`         | `htmx:after:swap`                 |
| `htmx:responseError`        | `htmx:error`                      |
| `htmx:sendError`            | `htmx:error`                      |
| `htmx:sendAbort`            | `htmx:error`                      |
| `htmx:swapError`            | `htmx:error`                      |
| `htmx:targetError`          | `htmx:error`                      |
| `htmx:timeout`              | `htmx:error`                      |

**Removed events (no htmx 4 equivalent):**

- `htmx:validation:validate`, `htmx:validation:failed`, `htmx:validation:halted` — use native form validation
- `htmx:xhr:loadstart`, `htmx:xhr:loadend`, `htmx:xhr:progress`, `htmx:xhr:abort` — XHR is gone

**In `hx-on:` attributes:**

```html
<!-- htmx 2 -->
<div hx-on:htmx:afterSwap="console.log('done')">

<!-- htmx 4 -->
<div hx-on:htmx:after:swap="console.log('done')">
```

**In `hx-trigger` attributes referencing htmx events:**

```html
<!-- htmx 2 -->
<div hx-get="/data" hx-trigger="htmx:afterSwap from:body">

<!-- htmx 4 -->
<div hx-get="/data" hx-trigger="htmx:after:swap from:body">
```

## Step 6: Update Event Handler Code

The event detail structure has changed. Key differences:

```js
// htmx 2: event.detail contained XHR object
document.addEventListener('htmx:configRequest', (evt) => {
    evt.detail.headers['X-Custom'] = 'value';
    evt.detail.parameters['key'] = 'value';
    evt.detail.path = '/modified-url';
});

// htmx 4: event.detail.ctx contains request context
document.addEventListener('htmx:config:request', (evt) => {
    evt.detail.ctx.request.headers['X-Custom'] = 'value';
    evt.detail.ctx.request.body.set('key', 'value');  // FormData
    evt.detail.ctx.request.action = '/modified-url';
});
```

## Step 7: Update Configuration

| htmx 2 config            | htmx 4 config                           |
|--------------------------|-----------------------------------------|
| `defaultSwapStyle`       | `defaultSwap`                           |
| `globalViewTransitions`  | `transitions`                           |
| `historyEnabled`         | `history`                               |
| `includeIndicatorStyles` | `includeIndicatorCSS`                   |
| `timeout`                | `defaultTimeout` (new default: 60000ms) |

Removed configs (no equivalent): `refreshOnHistoryMiss`, `historyCacheSize`, `defaultSwapDelay`,
`addedClass`, `settlingClass`, `swappingClass`, `allowEval`, `allowScriptTags`, `attributesToSettle`,
`useTemplateFragments`, `wsReconnectDelay`, `wsBinaryType`, `disableSelector`, `withCredentials`,
`scrollBehavior`, `getCacheBusterParam`, `methodsThatUseUrlParams`, `selfRequestsOnly`, `ignoreTitle`,
`scrollIntoViewOnBoost`, `triggerSpecsCache`, `allowNestedOobSwaps`, `responseHandling`.

## Step 8: Update Server-Side Header Handling

**Request headers your server reads:**

| htmx 2 header     | htmx 4 header | Format change                                        |
|-------------------|---------------|------------------------------------------------------|
| `HX-Trigger`      | `HX-Source`   | Was element ID → now `tag#id` (e.g. `button#submit`) |
| `HX-Trigger-Name` | Removed       | Use `HX-Source`                                      |
| `HX-Target`       | `HX-Target`   | Was element ID → now `tag#id`                        |
| `HX-Prompt`       | Removed       | Use `hx-confirm` with `js:` prefix                   |

New request header: `HX-Request-Type` (`"full"` or `"partial"`).

**Response headers your server sends:**

| htmx 2 header             | htmx 4 status             |
|---------------------------|---------------------------|
| `HX-Trigger-After-Swap`   | Removed; use `HX-Trigger` |
| `HX-Trigger-After-Settle` | Removed; use `HX-Trigger` |

Still supported: `HX-Trigger`, `HX-Push-Url`, `HX-Replace-Url`, `HX-Redirect`, `HX-Location`,
`HX-Refresh`, `HX-Retarget`, `HX-Reswap`, `HX-Reselect`.

## Step 9: Update JavaScript API Calls

| htmx 2                       | htmx 4                             |
|------------------------------|------------------------------------|
| `htmx.defineExtension(...)`  | `htmx.registerExtension(...)`      |
| `htmx.logAll()`              | `htmx.config.logAll = true`        |
| `htmx.logNone()`             | `htmx.config.logAll = false`       |
| `htmx.addClass(elt, cls)`    | `elt.classList.add(cls)`           |
| `htmx.removeClass(elt, cls)` | `elt.classList.remove(cls)`        |
| `htmx.toggleClass(elt, cls)` | `elt.classList.toggle(cls)`        |
| `htmx.closest(elt, sel)`     | `elt.closest(sel)`                 |
| `htmx.remove(elt)`           | `elt.remove()`                     |
| `htmx.off(elt, evt, fn)`     | `elt.removeEventListener(evt, fn)` |
| `htmx.values(elt)`           | `new FormData(elt)`                |

## Step 10: Update Extensions

Extensions need a full rewrite for htmx 4. The API changed from callback-based to event-based:

```js
// htmx 2
htmx.defineExtension('my-ext', {
    onEvent: function (name, evt) {
        if (name === 'htmx:configRequest') { /* ... */ }
    },
    transformResponse: function (text, xhr, elt) { /* ... */ }
});

// htmx 4
htmx.registerExtension('my-ext', {
    init(api) { /* receive internal API */ },
    htmx_config_request(elt, detail) {
        // detail.ctx has request context
    },
    htmx_after_request(elt, detail) {
        // detail.ctx.text has response text
    }
});
```

To restrict which extensions can load, use the `extensions` config as a whitelist:

```html
<meta name="htmx-config" content='{"extensions": "my-ext"}'>
```

## Step 11: Handle GET/DELETE Form Data Change

In htmx 4, `hx-delete` (like `hx-get`) no longer includes the enclosing form's inputs. If your
delete buttons relied on form data:

```html
<!-- htmx 2: form data included automatically -->
<form>
    <input type="hidden" name="token" value="abc">
    <button hx-delete="/item/1">Delete</button>
</form>

<!-- htmx 4: must explicitly include form -->
<form>
    <input type="hidden" name="token" value="abc">
    <button hx-delete="/item/1" hx-include="closest form">Delete</button>
</form>
```

## Step 12: Handle OOB Swap Order Change

In htmx 2, OOB swaps happened before the main content swap. In htmx 4, main content swaps first,
then OOB/partial elements swap after. If you have code that depends on OOB elements being present
when the main content is swapped, you may need to restructure.

## Step 13: Handle Non-200 Response Swapping

In htmx 2, 4xx and 5xx responses did not swap by default. In htmx 4, all responses swap except
204 (No Content) and 304 (Not Modified).

If your server returns error HTML in 4xx/5xx responses and you don't want it swapped in, either:

- Set `htmx.config.noSwap = [204, 304, "4xx", "5xx"]` to restore htmx 2 behavior
- Use `hx-status:4xx="swap:none"` and `hx-status:5xx="swap:none"` on specific elements
- Return 204 No Content when you want no swap to occur

## Compatibility Options

For large codebases where a full migration isn't practical all at once, there are two options to
ease the transition:

**Config flags** — add to your htmx config meta tag to restore htmx 2 defaults:

```html
<meta name="htmx-config" content='{
    "implicitInheritance": true,
    "noSwap": [204, 304, "4xx", "5xx"]
}'>
```

- `implicitInheritance: true` restores automatic attribute inheritance (skipping Step 3)
- `noSwap: [204, 304, "4xx", "5xx"]` restores htmx 2's 4xx/5xx no-swap behavior (skipping Step 13)

**Compatibility extension** — `htmx-2-compat.js` fires old event names alongside new ones and
handles old attribute names:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/htmx-2-compat.js"></script>
```

These are bridges for incremental migration, not long-term solutions.

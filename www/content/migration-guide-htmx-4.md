+++
title = "htmx 2.x &rarr; htmx 4.x Migration Guide"
+++

The purpose of this guide is to provide instructions for migrations from htmx 2.x to htmx 4.x.

htmx 4 is a _significant_ architectural rewrite which involves breaking changes. We have tried to maintain
backwards compatibility where possible but this upgrade will require more work than the htmx 1 to htmx 2 migration.

## Biggest Changes

The three most impactful changes in htmx 4 are:

* Switching to `fetch()` for issuing ajax requests 
* Making attribute inheritance explicit by default
* Adopting the [response targets extension](https://htmx.org/extensions/response-targets/) concept for retargeting based on
  HTTP response codes, and making most HTTP response codes swap content (including `4xx` and `5xx` response codes)

While there is no way to "undo" the first item in htmx 4, the second two changes can be undone by:

- Setting `htmx.config.implicitInheritance` to `true`, which will restore implicit attribute inheritance
- Setting `htmx.config.noSwap` to `[204, 304, '4xx', '5xx']`

Making these to changes will make many htmx 2-based applications work with htmx 4 without further changes.

## Attribute Changes

### Renamed Attributes

| htmx 2.x          | htmx 4.x     | Notes                                                                    |
|-------------------|--------------|--------------------------------------------------------------------------|
| `hx-disabled-elt` | `hx-disable` | Before upgrading, audit usage of `hx-disable` attribute (see note below) |

**Important Note on `hx-disable`:**

In htmx 2, `hx-disable` disables htmx processing. In htmx 4, `hx-ignore` serves this purpose. Before upgrading:

1. Search for any usage of `hx-disable` in your htmx 2 codebase
2. Rename `hx-disable` → `hx-ignore`
3. Then rename `hx-disabled-elt` → `hx-disable`

### Removed Attributes

The following attributes have been removed:

| Removed Attribute | htmx 4 Alternative                                                |
|-------------------|-------------------------------------------------------------------|
| `hx-vars`         | Use `hx-vals` with `js:` prefix                                   |
| `hx-params`       | Use `htmx:config:request` event to filter parameters              |
| `hx-prompt`       | Use `hx-confirm` with async JavaScript function                   |
| `hx-ext`          | Extensions now work via event listeners                           |
| `hx-disinherit`   | No longer needed (inheritance is explicit)                        |
| `hx-inherit`      | No longer needed (inheritance is explicit)                        |
| `hx-request`      | Use `hx-config`                                                   |
| `hx-history`      | Removed (history is no longer stored in local storage)            |
| `hx-history-elt`  | Removed (history uses target element)                             |

### New Attributes

| Attribute       | Purpose                                            |
|-----------------|----------------------------------------------------|
| `hx-action`     | Specifies URL (use with `hx-method`)               |
| `hx-method`     | Specifies HTTP method (use with `hx-action`)       |
| `hx-config`     | Configure request behavior with JSON               |

### Attribute Inheritance Changes

Inheritance is now, by default, **explicit** using the `:inherited` modifier.

Before (htmx 2):
```html
<!-- Attributes inherited automatically -->
<div hx-confirm="Are you sure?">
    <button hx-delete="/item/1">Delete 1</button>
    <button hx-delete="/item/2">Delete 2</button>
</div>
```

After (htmx 4):
```html
<!-- Must use :inherited modifier -->
<div hx-confirm:inherited="Are you sure?">
    <button hx-delete="/item/1">Delete 1</button>
    <button hx-delete="/item/2">Delete 2</button>
</div>
```

Any attribute can use the `:inherited` modifier: `hx-boost:inherited`, `hx-headers:inherited`, `hx-target:inherited`, etc.

As mentioned above, you can revert this behavior by setting `htmx.config.implicitInheritance` to `true`

---

## Event Name Changes

htmx 4 uses a new event naming convention: `htmx:phase:action[:sub-action]`, and so if you are using htmx events you
need to rename the events that they are listening for.  Here is a complete table with the htmx 4 equivalent events:


| htmx 2.x Event              | htmx 4.x Event                    | Notes                                |
|-----------------------------|-----------------------------------|--------------------------------------|
| `htmx:afterOnLoad`          | `htmx:after:init`                 |                                      |
| `htmx:afterProcessNode`     | `htmx:after:init`                 |                                      |
| `htmx:afterRequest`         | `htmx:after:request`              |                                      |
| `htmx:afterSettle`          | `htmx:after:swap`                 |                                      |
| `htmx:afterSwap`            | `htmx:after:swap`                 |                                      |
| `htmx:beforeCleanupElement` | `htmx:before:cleanup`             |                                      |
| `htmx:beforeHistorySave`    | `htmx:before:history:update`      |                                      |
| `htmx:beforeHistoryUpdate`  | `htmx:before:history:update`      |                                      |
| `htmx:beforeOnLoad`         | `htmx:before:init`                |                                      |
| `htmx:beforeProcessNode`    | `htmx:before:process`             |                                      |
| `htmx:beforeRequest`        | `htmx:before:request`             |                                      |
| `htmx:beforeSend`           | `htmx:before:request`             |                                      |
| `htmx:beforeSwap`           | `htmx:before:swap`                |                                      |
| `htmx:beforeTransition`     | `htmx:before:viewTransition`      |                                      |
| `htmx:configRequest`        | `htmx:config:request`             |                                      |
| `htmx:historyCacheMiss`     | `htmx:before:restore:history`     |                                      |
| `htmx:historyRestore`       | `htmx:before:restore:history`     |                                      |
| `htmx:load`                 | `htmx:after:init`                 |                                      |
| `htmx:oobAfterSwap`         | `htmx:after:swap`                 | No separate OOB swap events          |
| `htmx:oobBeforeSwap`        | `htmx:before:swap`                | No separate OOB swap events          |
| `htmx:pushedIntoHistory`    | `htmx:after:push:into:history`    |                                      |
| `htmx:replacedInHistory`    | `htmx:after:replace:into:history` |                                      |
| `htmx:responseError`        | `htmx:error`                      | All errors consolidated              |
| `htmx:sendError`            | `htmx:error`                      | All errors consolidated              |
| `htmx:sendAbort`            | `htmx:error`                      | All errors consolidated              |
| `htmx:swapError`            | `htmx:error`                      | All errors consolidated              |
| `htmx:targetError`          | `htmx:error`                      | All errors consolidated              |
| `htmx:timeout`              | `htmx:error`                      | All errors consolidated              |
| `htmx:validation:validate`  | _Removed_                         | Use native form validation           |
| `htmx:validation:failed`    | _Removed_                         | Use native form validation           |
| `htmx:validation:halted`    | _Removed_                         | Use native form validation           |
| `htmx:xhr:abort`            | _Removed_                         | Use `htmx:error` event               |
| `htmx:xhr:loadstart`        | _Removed_                         | No fetch() equivalent                |
| `htmx:xhr:loadend`          | _Removed_                         | Use `htmx:finally:request`           |
| `htmx:xhr:progress`         | _Removed_                         | Use fetch() streams API if needed    |

### XHR Upload Progress Events Removed

In htmx 2.x, the following XHR upload progress events were available:

- `htmx:xhr:loadstart`
- `htmx:xhr:loadend`
- `htmx:xhr:progress`
- `htmx:xhr:abort`

These events provided detailed upload progress information with `lengthComputable`, `loaded`, and `total` properties.

In htmx 4.x these events have been removed because htmx now uses the `fetch()` API instead of `XMLHttpRequest`.


If you need upload progress tracking in htmx 4:

1. Use the `htmx:config:request` event to access the request context
2. Implement custom fetch with progress tracking using fetch streams or a library
3. Consider using a specialized upload library for complex upload scenarios

### New Events in htmx 4

* `htmx:after:cleanup` - Triggered after element cleanup
* `htmx:after:history:update` - Triggered after history is updated
* `htmx:after:implicitInheritance` - Triggered when implicit inheritance occurs (when config enabled)
* `htmx:after:process` - Triggered after processing an element
* `htmx:after:restore` - Triggered after all restore tasks complete
* `htmx:after:viewTransition` - Triggered after view transition completes
* `htmx:after:sse:message` - Triggered after processing an SSE message
* `htmx:after:sse:stream` - Triggered after an SSE stream ends
* `htmx:before:sse:message` - Triggered before processing an SSE message
* `htmx:before:sse:reconnect` - Triggered before reconnecting to SSE stream
* `htmx:before:sse:stream` - Triggered before processing an SSE stream
* `htmx:finally:request` - Always triggered after request completes (success or error)

---

## JavaScript API Changes

The htmx JavaScript API has changed significantly in htmx 4.

### Removed API Methods

The following JavaScript API methods have been removed in htmx 4:

| htmx 2.x Method          | htmx 4 Alternative                                |
|--------------------------|---------------------------------------------------|
| `htmx.addClass()`        | Use native `element.classList.add()`              |
| `htmx.closest()`         | Use native `element.closest()`                    |
| `htmx.location()`        | Use `htmx.ajax()` instead                         |
| `htmx.logAll()`          | Set `htmx.config.logAll = true`                   |
| `htmx.logNone()`         | Set `htmx.config.logAll = false`                  |
| `htmx.logger`            | Use browser DevTools or custom event listeners    |
| `htmx.off()`             | Use native `removeEventListener()`                |
| `htmx.remove()`          | Use native `element.remove()`                     |
| `htmx.removeClass()`     | Use native `element.classList.remove()`           |
| `htmx.removeExtension()` | Extensions are now event-based, no removal needed |
| `htmx.toggleClass()`     | Use native `element.classList.toggle()`           |

### Retained API Methods

These methods continue to exist in htmx 4:

* `htmx.ajax(verb, path, context)` - Issue AJAX requests programmatically
* `htmx.config` - Configuration object (with new options)
* `htmx.registerExtension(name, extension)` - Register extensions
* `htmx.find(selector)` - Find elements (supports extended selectors)
* `htmx.findAll(selector)` - Find all matching elements (supports extended selectors)
* `htmx.onLoad(callback)` - a callback that will be called with the newly added content on every swap by htmx
* `htmx.on(eventName, handler)` - Add event listener
* `htmx.parseInterval(str)` - Parse interval strings like "1s", "500ms"
* `htmx.process(element)` - Process htmx attributes on an element
* `htmx.swap()` - Swap content into the DOM
* `htmx.trigger(element, eventName, detail)` - Trigger custom events

### New API Methods

* `htmx.forEvent(eventName, timeout)` - Returns a promise that resolves when an event fires
* `htmx.timeout(time)` - Returns a promise that resolves after specified time

### Extension API Changes

Extensions in htmx 4 use a new event-based hook system instead of the callback-based API. The method name has also changed from `defineExtension()` to `registerExtension()` to avoid conflicts with htmx 2.x.

**Key changes:**
- Method renamed: `htmx.defineExtension()` → `htmx.registerExtension()`
- Event-based hooks instead of callback methods
- Hook names use underscores: `htmx_before_request` instead of `onEvent`
- Extensions must be approved via config
- Full request context available via `detail.ctx`

Extensions will almost certainly need a rewrite. Please see our [Extensions documentation](https://htmx.org/extensions/) and [Extension Migration Guide](https://htmx.org/extensions/migration-guide) for more information.

---

## Upgrade Music

This is the official htmx 2.x -> 4.x upgrade music:

<iframe width="1023" height="644" src="https://www.youtube.com/embed/j4fFd0dejqk" title="Playtime Is Over" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
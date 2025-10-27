+++
title = "htmx 2.x &rarr; htmx 4.x Migration Guide"
+++

The purpose of this guide is to provide instructions for migrations from htmx 2.x to htmx 4.x.

**Note:** htmx 4 is a significant architectural rewrite with many breaking changes. While we have tried to maintain
backwards compatibility where possible, this upgrade will require more work than previous htmx versions.

## Biggest Changes

The two most impactful changes in htmx 4 are:

1. **Default swap strategy changed from `innerHTML` to `outerHTML`**
2. **Removal of implicit attribute inheritance** - inheritance now requires the `:inherited` modifier

These will likely affect most htmx applications and should be addressed first.

## New Features

* **Optimistic Updates** - Built-in support for optimistic UI updates with `hx-optimistic`
* **Server Actions (Partials)** - New `<partial>` element system for cleaner multi-target responses
* **Request Preloading** - Preload requests on events with `hx-preload` for better perceived performance
* **View Transitions** - Enabled by default for smoother page updates
* **Unified Request Context** - All events provide a consistent `ctx` object

---

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

| Removed Attribute | htmx 4 Alternative                                   |
|-------------------|------------------------------------------------------|
| `hx-vars`         | Use `hx-vals` with `js:` prefix                      |
| `hx-params`       | Use `htmx:config:request` event to filter parameters |
| `hx-prompt`       | Use `hx-confirm` with async JavaScript function      |
| `hx-ext`          | Extensions now work via event listeners              |
| `hx-disinherit`   | No longer needed (inheritance is explicit)           |
| `hx-inherit`      | No longer needed (inheritance is explicit)           |
| `hx-request`      | Use `hx-config`                                      |
| `hx-history-elt`  | Removed (history uses target element)                |
| `hx-select-oob`   | Use `<partial>` elements or standard OOB swaps       |

### New Attributes

| Attribute       | Purpose                                            |
|-----------------|----------------------------------------------------|
| `hx-action`     | Specifies URL (use with `hx-method`)               |
| `hx-method`     | Specifies HTTP method (use with `hx-action`)       |
| `hx-config`     | Configure request behavior with JSON               |
| `hx-optimistic` | Show optimistic content while request is in flight |
| `hx-preload`    | Preload a request on a trigger event               |

### Attribute Inheritance Changes

Inheritance is now **explicit** using the `:inherited` modifier.

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

---

## Event Name Changes

htmx 4 uses a new event naming convention: `htmx:phase:action`

### Complete Event Mapping

| htmx 2.x Event              | htmx 4.x Event                    |
|-----------------------------|-----------------------------------|
| `htmx:afterOnLoad`          | `htmx:after:init`                 |
| `htmx:afterProcessNode`     | `htmx:after:init`                 |
| `htmx:afterRequest`         | `htmx:after:request`              |
| `htmx:afterSettle`          | `htmx:after:swap`                 |
| `htmx:afterSwap`            | `htmx:after:swap`                 |
| `htmx:beforeCleanupElement` | `htmx:before:cleanup`             |
| `htmx:beforeHistorySave`    | `htmx:before:history:update`      |
| `htmx:beforeOnLoad`         | `htmx:before:init`                |
| `htmx:beforeProcessNode`    | `htmx:before:init`                |
| `htmx:beforeRequest`        | `htmx:before:request`             |
| `htmx:beforeSwap`           | `htmx:before:swap`                |
| `htmx:configRequest`        | `htmx:config:request`             |
| `htmx:historyCacheMiss`     | `htmx:before:restore:history`     |
| `htmx:historyRestore`       | `htmx:after:restore:history`      |
| `htmx:load`                 | `htmx:after:init`                 |
| `htmx:oobAfterSwap`         | `htmx:after:oob:swap`             |
| `htmx:oobBeforeSwap`        | `htmx:before:oob:swap`            |
| `htmx:pushedIntoHistory`    | `htmx:after:push:into:history`    |
| `htmx:replacedInHistory`    | `htmx:after:replace:into:history` |
| `htmx:responseError`        | `htmx:error`                      |
| `htmx:sendError`            | `htmx:error`                      |
| `htmx:swapError`            | `htmx:error`                      |
| `htmx:targetError`          | `htmx:error`                      |
| `htmx:timeout`              | `htmx:error`                      |

### New Events in htmx 4

* `htmx:after:cleanup`
* `htmx:after:history:update`
* `htmx:after:main:swap`
* `htmx:after:partial:swap`
* `htmx:before:main:swap`
* `htmx:before:partial:swap`
* `htmx:finally:request`

### Event Detail Changes

TBD

---

## Configuration Changes

### Default Value Changes

| Config Option                                   | htmx 2.x Default | htmx 4.x Default |
|-------------------------------------------------|------------------|------------------|
| `defaultSwapStyle`                              | `innerHTML`      | `outerHTML`      |
| `viewTransitions` (was `globalViewTransitions`) | `false`          | `true`           |

To restore htmx 2 behavior:

```javascript
htmx.config.defaultSwapStyle = 'innerHTML';
htmx.config.viewTransitions = false;
```

### Removed Config Options

These config options have been removed from core:

* `wsReconnectDelay` - WebSocket extension only
* `wsBinaryType` - WebSocket extension only

---

## Upgrade Music

This is the official htmx 2.x -> 4.x upgrade music:

<iframe width="640" height="360" src="https://www.youtube.com/watch?v=NZf15xVrOW8" title="Zombie Hyperdrive - Red Eyes"
        frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

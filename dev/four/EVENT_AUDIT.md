# HTMX Event Comparison: htmx 1.x/2.x vs Moxi (htmx 4.0)

## Event Mapping

### Request Lifecycle Events

| htmx 1.x/2.x Event   | Moxi Event                          | Notes                                                  |
|----------------------|-------------------------------------|--------------------------------------------------------|
| `htmx:configRequest` | `htmx:config:request`               | Request configuration phase                            |
| `htmx:beforeRequest` | `htmx:before:request`               | Before request is sent                                 |
| `htmx:beforeSend`    | *(merged into htmx:before:request)* | Combined with beforeRequest                            |
| `htmx:afterRequest`  | `htmx:after:request`                | After request completes                                |
| `htmx:afterOnLoad`   | *Obsoleted*                         | Combined with afterRequest                             |
| `htmx:beforeOnLoad`  | *(merged into htmx:after:request)*  | No direct equivalent                                   |
| *(none)*             | `htmx:finally:request`              | **NEW**: Always fires after request (success or error) |

### Swap Events

| htmx 1.x/2.x Event      | Moxi Event                 | Notes                                    |
|-------------------------|----------------------------|------------------------------------------|
| `htmx:beforeSwap`       | `htmx:before:swap`         | Swap happens directly in moxi            |
| `htmx:afterSwap`        | `htmx:after:swap`          | After content is swapped                 |
| `htmx:afterSettle`      | *Obsoleted*                | No settle phase in moxi                  |
| `htmx:beforeTransition` | *Obsoleted*                | Transitions handled differently          |
| `htmx:oobBeforeSwap`    | `htmx:before:oob:swap`     | OOB swaps use partials                   |
| `htmx:oobAfterSwap`     | `htmx:after:oob:swap`      | Out-of-band swap completed               |
| *(none)*                | `htmx:before:partial:swap` | **NEW**: Partial/template swap completed |
| *(none)*                | `htmx:before:after:swap`   | **NEW**: Partial/template swap completed |

### Element Processing Events

| htmx 1.x/2.x Event          | Moxi Event               | Notes                                       |
|-----------------------------|--------------------------|---------------------------------------------|
| `htmx:beforeProcessNode`    | `htmx:before:init`       | No longer triggered                         |
| `htmx:afterProcessNode`     | `htmx:after:init`        | No longer triggered                         |
| `load`                      | `load`                   | Behaves the same                            |
| `htmx:beforeCleanupElement` | `htmx:bfore:cleanup`     |                                             |
| *(none)*                    | `htmx:after:cleanup`     |                                             |
| *(none)*                    | `htmx:before:processing` | **NEW**: Element is being processed by htmx |

### History Events

| htmx 1.x/2.x Event          | Moxi Event                        | Notes                     |
|-----------------------------|-----------------------------------|---------------------------|
| `htmx:beforeHistoryUpdate`  | `htmx:before:history:update`      | Before history is updated |
| `htmx:pushedIntoHistory`    | `mx:after:push:into:history`      | pushState called          |
| `htmx:replacedInHistory`    | `htmx:after:replace:into:history` | replaceState called       |
| `htmx:historyRestore`       | `htmx:before:restore:history`     | History entry restored    |
| `htmx:historyCacheHit`      | *(removed)*                       | Cache handling simplified |
| `htmx:historyCacheMiss`     | *(removed)*                       | Cache handling simplified |
| `htmx:historyCacheMissLoad` | *(removed)*                       | Cache handling simplified |
| `htmx:historyItemCreated`   | *(removed)*                       | Not exposed in moxi       |
| `htmx:beforeHistorySave`    | *(removed)*                       | Not exposed in moxi       |
| `htmx:restored`             | *(removed)*                       | Not exposed in moxi       |

### User Interaction Events

| htmx 1.x/2.x Event | Moxi Event  | Notes                                                  |
|--------------------|-------------|--------------------------------------------------------|
| `htmx:confirm`     | *(removed)* | Confirmation handled differently                       |
| `htmx:prompt`      | *(removed)* | Prompts not built-in                                   |
| `htmx:trigger`     | *(removed)* | Trigger events simplified                              |
| `revealed`         | `revealed`   | **KEPT**: Implemented with intersection observer event |
| `intersect`        | `intersect` | **KEPT**: Intersection observer event                  |
| *(none)*           | `every`     | **NEW**: Polling/every trigger fired                   |

### Error & Validation Events

| htmx 1.x/2.x Event         | Moxi Event   | Notes                         |
|----------------------------|--------------|-------------------------------|
| `htmx:error`               | `htmx:error` | Error occurred during request |
| `htmx:abort`               | *(removed)*  | Request abortion not exposed  |
| `htmx:validation:validate` | *(removed)*  | Validation not built-in       |
| `htmx:validation:failed`   | *(removed)*  | Validation not built-in       |
| `htmx:validation:halted`   | *(removed)*  | Validation not built-in       |
| `htmx:validateUrl`         | *(removed)*  | URL validation not built-in   |

### XHR Events

| htmx 1.x/2.x Event | Moxi Event  | Notes                                                            |
|--------------------|-------------|------------------------------------------------------------------|
| `htmx:xhr:*`       | *(removed)* | Raw XHR events not exposed (loadstart, loadend, progress, abort) |

## Summary Statistics

- **htmx 1.x/2.x Events**: 38 distinct events
- **Moxi Events**: 17 distinct events
- **Removed Events**: 28 events
- **New Events**: 7 events (`mx:finally`, `mx:partialSwapped`, `mx:oobSwapped`, `mx:processing`, `mx:init`, `mx:inited`,
  `init`, `every`)
- **Kept/Renamed Events**: 10 events

## Key Changes

### Simplifications

1. **Merged lifecycle events**: `beforeRequest`/`beforeSend` → `mx:before`, `afterRequest`/`afterOnLoad` → `mx:after`
2. **Removed settle phase**: No more `afterSettle` or separate settling logic
3. **Removed validation system**: All `validation:*` events removed
4. **Simplified history**: Removed cache-specific events
5. **Removed XHR passthrough**: No more `htmx:xhr:*` events

### New Capabilities

1. **`mx:finally`**: Guaranteed cleanup event (like try/catch/finally)
2. **Partial system**: New `mx:partialSwapped` for template-based swaps
3. **Better initialization**: Separate `mx:init` and `mx:inited` events
4. **Processing visibility**: `mx:processing` to track element processing

### Naming Convention

- htmx 1.x/2.x: `htmx:*` prefix
- Moxi: `mx:*` prefix (shorter, cleaner)

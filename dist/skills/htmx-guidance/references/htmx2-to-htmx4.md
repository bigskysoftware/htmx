# htmx 2 to htmx 4 Migration Reference

## htmx 2 vs htmx 4: Practical Differences

If you're unsure which version a project uses, check for `fetch()` usage in htmx source, the `:inherited`
modifier on attributes, or colon-separated event names like `htmx:after:swap`. These are all htmx 4 indicators.

### Attributes

| htmx 2                               | htmx 4                                                        | Notes                                             |
|--------------------------------------|---------------------------------------------------------------|---------------------------------------------------|
| `hx-disabled-elt`                    | `hx-disable`                                                  | Renamed                                           |
| `hx-disable` (stops htmx processing) | `hx-ignore`                                                   | Different purpose in each version                 |
| `hx-ext="my-ext"`                    | Just include the script file                                  | No attribute needed; config whitelist is optional  |
| `hx-request='{"timeout":5000}'`      | `hx-config='{"timeout":5000}'`                                | Renamed                                           |
| `hx-prompt="Enter value"`            | [`hx-prompt` extension](https://four.htmx.org/extensions/hx-prompt) (same syntax), or [`hx-on::config:request` one-liner](https://four.htmx.org/extensions/hx-prompt#without-the-extension) | Restored via extension                            |
| `hx-disinherit="*"`                  | Not needed                                                    | Inheritance is explicit by default in htmx 4      |
| `hx-vars`                            | `hx-vals` with `js:` prefix                                   | hx-vars removed                                   |
| Attributes inherit implicitly        | Must use `:inherited` modifier                                | `hx-target:inherited="#out"`                      |
| `data-hx-get` works automatically    | `data-hx-get` still works                                     | `config.prefix` defaults to `"data-hx-"`          |

htmx 4 adds: `hx-action`, `hx-method`, `hx-config`, `hx-status:XXX`, `hx-partial`, `:inherited` and `:append` modifiers.

### Events

htmx 2 uses camelCase: `htmx:afterSwap`, `htmx:beforeRequest`, `htmx:configRequest`.

htmx 4 uses colons: `htmx:after:swap`, `htmx:before:request`, `htmx:config:request`.

Most error events (`htmx:sendError`, `htmx:swapError`, `htmx:targetError`, `htmx:timeout`) are consolidated into
`htmx:error` in htmx 4. HTTP error responses fire `htmx:response:error` (replacing `htmx:responseError`).

### Configuration

| htmx 2                              | htmx 4                               | Notes                            |
|-------------------------------------|--------------------------------------|----------------------------------|
| `htmx.config.defaultSwapStyle`      | `htmx.config.defaultSwap`            | Renamed                          |
| `htmx.config.timeout = 0`           | `htmx.config.defaultTimeout = 60000` | Renamed + default changed to 60s |
| `htmx.config.globalViewTransitions` | `htmx.config.transitions`            | Renamed                          |
| `htmx.config.historyEnabled`        | `htmx.config.history`                | Renamed                          |
| `htmx.config.selfRequestsOnly`      | `htmx.config.mode = 'same-origin'`   | Different mechanism              |
| `responseHandling` array            | `htmx.config.noSwap` + `hx-status`   | Simpler model                    |
| 4xx/5xx don't swap by default       | All status codes swap except 204/304 | Major behavior change            |
| History stored in localStorage      | History does full page refresh       | No more localStorage snapshots   |

### JavaScript API

| htmx 2                                        | htmx 4                      | Notes                            |
|-----------------------------------------------|-----------------------------|----------------------------------|
| `htmx.defineExtension()`                      | `htmx.registerExtension()`  | Renamed                          |
| `htmx.addClass()`, `htmx.removeClass()`, etc. | Native DOM methods          | Removed; use `element.classList` |
| `htmx.off()`                                  | `removeEventListener()`     | Removed; use native              |
| `htmx.remove()`                               | `element.remove()`          | Removed; use native              |
| `htmx.swap(target, content, spec)`            | `htmx.swap(ctx)`            | Signature changed                |

htmx 4 adds: `htmx.timeout()`. Logging now goes directly to `console.error` / `console.warn` / `console.log` (gated by `config.logAll` for events). `htmx.takeClass()` is **removed**; use `htmx.live.take()` (provided by the `hx-live` extension) or the unprefixed `take` helper inside expression scope. The `hx-live` extension also exposes `htmx.live.forEvent()`, `htmx.live.nextFrame()`, `htmx.live.q()`, `htmx.live.debounce()`, `htmx.live.refresh()`.

### Swap Styles

htmx 4 adds `innerMorph`, `outerMorph`, `textContent`, and shorthand names (`before`, `after`, `prepend`, `append`).

### HTTP Headers

| htmx 2                               | htmx 4      | Notes                                       |
|--------------------------------------|-------------|---------------------------------------------|
| `HX-Trigger` (request header)        | `HX-Source` | Renamed; format changed from ID to `tag#id` |
| `HX-Trigger-Name`                    | Removed     | Use `HX-Source`                             |
| `HX-Trigger-After-Swap` (response)   | Removed     | Use `HX-Trigger`                            |
| `HX-Trigger-After-Settle` (response) | Removed     | Use `HX-Trigger`                            |

htmx 4 adds: `HX-Request-Type` (`"full"` or `"partial"`).

### Extensions

htmx 2: `hx-ext="my-extension"` attribute on elements, `htmx.defineExtension("name", {onEvent: ...})`.

htmx 4: Just include the script. `htmx.registerExtension("name", {htmx_before_request: ...})`. Config whitelist optional.
Hook names use underscores (`htmx_before_swap`) instead of a single `onEvent` callback.

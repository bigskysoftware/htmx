# Attributes, Parameters, and JavaScript API

## Other Attributes

| Attribute        | Description                                                               |
|------------------|---------------------------------------------------------------------------|
| `hx-select`      | CSS selector to pick part of the response                                 |
| `hx-select-oob`  | Pick out elements by ID for OOB swap                                      |
| `hx-include`     | Include additional elements' values in request                            |
| `hx-vals`        | Add values to request. Supports `js:` prefix for dynamic values           |
| `hx-headers`     | Add custom headers to request                                             |
| `hx-indicator`   | Element to show during request (gets `htmx-request` class)                |
| `hx-confirm`     | Show confirmation dialog. Supports `js:` prefix for async confirmation    |
| `hx-sync`        | Synchronize requests between elements                                     |
| `hx-boost`       | Progressive enhancement for links and forms                               |
| `hx-config`      | Per-element Fetch config (`timeout`, `credentials`, `cache`, etc.). Cannot override `mode` |
| `hx-preserve`    | Keep element unchanged across swaps                                       |
| `hx-ignore`      | Disable htmx processing for element and children                          |
| `hx-disable`     | Disable specified elements during requests                                |
| `hx-preload`     | Preload content on trigger events                                         |
| `hx-pending`     | Show pending content during request                                       |
| `hx-push-url`    | Push URL to browser history                                               |
| `hx-replace-url` | Replace URL in browser history                                            |
| `hx-encoding`    | Change encoding (e.g. `multipart/form-data` for file uploads)             |
| `hx-validate`    | Validate form elements before request                                     |
| `hx-action`      | Request URL, when the method comes from `hx-method`                       |
| `hx-method`      | HTTP method, paired with `hx-action`                                      |
| `hx-status:XXX`  | Change target, swap or history handling for one status code               |
| `hx-history-elt` | Element to restore on history navigation, instead of `body`               |
| `hx-morph-skip`  | Freeze this element during a morph swap                                   |
| `hx-morph-skip-children` | Update attributes but freeze children during a morph swap         |

## Parameters

- Non-GET/DELETE requests automatically include enclosing form values
- GET and DELETE do NOT include enclosing form data. Use `hx-include="closest form"` if needed
- Use `hx-vals="key:value"` for static values. `hx-vals` takes HCON, which also accepts JSON
- Use `hx-vals='js:{"key": computeValue()}'` for dynamic values
- `hx-headers` and `hx-config` take HCON too

## JavaScript API

```js
htmx.version                                     // Version string, read-only
htmx.ajax("GET", "/data", {target: "#result"})   // Programmatic request, returns Promise
htmx.on("htmx:after:swap", (evt) => {})          // Event listener
htmx.onLoad((elt) => {})                         // Callback for new content
htmx.process(element)                            // Initialize htmx on dynamic content
htmx.initialize()                                // Set up history and process document.body
htmx.find("closest .container")                  // Extended CSS selector query
htmx.findAll(".items")                           // Find all matching
htmx.trigger(elt, "myEvent", {detail: ...})      // Fire custom event
htmx.swap(ctx)                                   // Manual swap
htmx.timeout(1000)                               // Promise that resolves after a delay
htmx.parseInterval("2s")                         // Parse a time interval to ms
htmx.registerExtension("name", hooks)            // Register an extension
```

The `hx-live` extension adds an `htmx.live` namespace: `take()`, `toggle()`, `attr()`, `q()` (alias `$`),
`debounce()`, `refresh()`, `forEvent()` and `nextFrame()`.

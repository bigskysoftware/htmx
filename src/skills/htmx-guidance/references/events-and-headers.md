# Events and HTTP Headers

## Events

htmx 4 naming convention: `htmx:phase:action`

**Element lifecycle:**

- `htmx:before:process` / `htmx:after:process` -- htmx scans a subtree
- `htmx:before:init` / `htmx:after:init` -- element initialization
- `htmx:before:cleanup` / `htmx:after:cleanup` -- element removal
- `htmx:before:on:init` -- before an `hx-on` handler is installed

**Request:**

- `htmx:confirm` -- after trigger, before request. Detail holds `issueRequest` and `dropRequest` for async confirmation
- `htmx:config:request` -- configure request (modify headers, body, URL). Cancel with `evt.preventDefault()`
- `htmx:before:request` -- just before fetch. Cancel with `evt.preventDefault()`
- `htmx:before:response` -- after fetch response received, before body consumed
- `htmx:after:request` -- after request completes
- `htmx:finally:request` -- when request completes, fails, or is cancelled
- `htmx:error` -- on any error (network, response, swap)
- `htmx:response:error` -- the server returned an HTTP error status

**Swap:**

- `htmx:before:swap` / `htmx:after:swap` -- before/after content swap
- `htmx:finally:swap` -- after the swap, on success or error
- `htmx:before:settle` / `htmx:after:settle` -- before/after settle phase

**History:**

- `htmx:before:history:update` / `htmx:after:history:update`
- `htmx:after:history:push` / `htmx:after:history:replace`
- `htmx:before:history:restore`

**View Transitions:**

- `htmx:before:viewTransition` / `htmx:after:viewTransition`

**Aborting a request:** `htmx:abort` is an event you dispatch, not one htmx fires. Send it at an element to
cancel that element's in-flight requests:

```js
htmx.trigger("#slow-thing", "htmx:abort");
```

A few hooks are delivered to extensions only and never reach the DOM: `htmx:before:morph:node`,
`htmx:before:morph:attr`, `htmx:after:implicitInheritance` and `htmx:process:<type>`.

### Request Context

Events expose `detail.ctx` with the full request context:

```js
document.body.addEventListener('htmx:config:request', (evt) => {
    let ctx = evt.detail.ctx;
    // ctx.sourceElement  -- element that triggered request
    // ctx.target         -- swap target element
    // ctx.swap           -- hx-swap value
    // ctx.request.action -- URL
    // ctx.request.method -- HTTP method
    // ctx.request.headers -- headers object
    // ctx.request.body   -- FormData body
});
```

### Inline Event Handlers

Use `hx-on:event-name` for inline handlers:

```html

<button hx-get="/data" hx-on:htmx:after:swap="alert('Swapped!')">Load</button>
```

## HTTP Headers

### Request Headers (sent by htmx)

| Header                       | Description                                                                     |
|------------------------------|---------------------------------------------------------------------------------|
| `HX-Request`                 | Always `"true"` for htmx requests                                               |
| `HX-Source`                  | Triggering element as `tag#id` (e.g. `button#submit`)                           |
| `HX-Target`                  | Target element as `tag#id` (e.g. `div#results`)                                 |
| `HX-Current-URL`             | Browser's current URL                                                           |
| `HX-Request-Type`            | `"partial"` for targeted swaps, `"full"` when targeting body or using hx-select |
| `HX-Boosted`                 | `"true"` if via hx-boost                                                        |
| `HX-History-Restore-Request` | `"true"` if restoring history                                                   |

### Response Headers (server sends to htmx)

| Header           | Description                                      |
|------------------|--------------------------------------------------|
| `HX-Trigger`     | Trigger client-side events (single name or JSON) |
| `HX-Push-Url`    | Push URL to browser history                      |
| `HX-Replace-Url` | Replace current URL in history                   |
| `HX-Redirect`    | Client-side redirect (full page)                 |
| `HX-Location`    | Client-side redirect via AJAX (no full reload)   |
| `HX-Refresh`     | Full page refresh if `"true"`                    |
| `HX-Retarget`    | Override target with CSS selector                |
| `HX-Reswap`      | Override swap strategy                           |
| `HX-Reselect`    | Override hx-select                               |

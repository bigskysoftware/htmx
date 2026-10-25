# Events and Event Data

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
| `htmx:afterSettle`          | `htmx:after:settle`               |
| `htmx:beforeSend`           | `htmx:before:request`             |
| `htmx:load`                 | `htmx:after:init`                 |
| `htmx:beforeOnLoad`         | `htmx:before:init`                |
| `htmx:afterOnLoad`          | `htmx:after:init`                 |
| `htmx:beforeProcessNode`    | `htmx:before:process`             |
| `htmx:afterProcessNode`     | `htmx:after:process`              |
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
| `htmx:responseError`        | `htmx:response:error`             |
| `htmx:sendError`            | `htmx:error`                      |
| `htmx:sendAbort`            | `htmx:error`                      |
| `htmx:swapError`            | `htmx:error`                      |
| `htmx:targetError`          | `htmx:error`                      |
| `htmx:timeout`              | `htmx:error`                      |

**Removed events (no htmx 4 equivalent):**

- `htmx:validation:validate`, `htmx:validation:failed`, `htmx:validation:halted` -- use native form validation
- `htmx:xhr:loadstart`, `htmx:xhr:loadend`, `htmx:xhr:progress`, `htmx:xhr:abort` -- XHR is gone

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

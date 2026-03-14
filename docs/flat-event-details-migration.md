# Migration Guide: Flat Event Details (if PR merges)

PR: `four-api/flat-event-details` on `scriptogre/htmx`

## What Changed

Event details no longer wrap properties in a `ctx` object. Before:

```js
document.addEventListener('htmx:before:request', (e) => {
    let url = e.detail.ctx.request.action
})
```

After:

```js
document.addEventListener('htmx:before:request', (e) => {
    let url = e.detail.request.action
})
```

The `{ctx}` wrapper was unnecessary nesting — 6 of 9 events had nothing beside `ctx` in their detail. Now the detail IS the context object directly.

## What to Search For

Run these searches across the new website content:

```
detail.ctx
e.detail.ctx
evt.detail.ctx
event.detail.ctx
```

Every match needs `ctx.` removed. For example:
- `e.detail.ctx.request` → `e.detail.request`
- `e.detail.ctx.response` → `e.detail.response`
- `e.detail.ctx.target` → `e.detail.target`
- `e.detail.ctx.confirm` → `e.detail.confirm`
- `e.detail.ctx.keepIndicators` → `e.detail.keepIndicators`

## Extension Authoring Docs

Extension hooks also changed. Before:

```js
htmx_before_request: (elt, detail) => {
    let url = detail.ctx.request.action
}
```

After:

```js
htmx_before_request: (elt, detail) => {
    let url = detail.request.action
}
```

The `detail` parameter in extension hooks IS the context object now — no `.ctx` indirection.

## Files Updated in the Old Website (www/)

These files were already updated in the PR and can be used as reference:

- `www/content/docs.md`
- `www/content/events.md`
- `www/content/extensions/building.md`
- `www/content/extensions/migration-guide.md`
- `www/content/migration-guide-htmx-4.md`
- `www/templates/shortcodes/demo_environment.html`

## Affected Events

All request lifecycle events:
- `htmx:config:request`
- `htmx:confirm`
- `htmx:before:request`
- `htmx:after:request`
- `htmx:before:response`
- `htmx:before:swap`
- `htmx:after:swap`
- `htmx:after:settle`
- `htmx:finally:request`

## Detail Properties (top-level, no more ctx)

Common properties directly on `e.detail`:
- `request` — {action, method, headers, body, ...fetch options}
- `response` — {status, raw, text, ...}
- `target` — target element
- `source` — source element
- `swap` — swap strategy
- `select` — CSS selector
- `confirm` — confirmation message
- `cancelled` — whether extensions cancelled
- `keepIndicators` — whether to preserve loading state
- `error` — error object (on error events)

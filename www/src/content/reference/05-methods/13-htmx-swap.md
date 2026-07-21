---
title: "htmx.swap()"
description: "Swaps HTML content"
---

Use `htmx.swap()` to run the swap lifecycle without issuing a request.

```javascript
await htmx.swap({
  text: '<p>Done</p>',
  target: '#result'
})
```

htmx swaps the content into `#result` with the default swap style.

For requests, use [`htmx.ajax()`](/reference/methods/htmx-ajax).

## Syntax

```javascript
htmx.swap(ctx)
```

Set the content, target, and swap style in the context:

```javascript
await htmx.swap({
  text: '<p>Done</p>',
  target: '#result',
  swap: 'outerHTML transition:true'
})
```

## Context

### `text`

The HTML string to swap.

```javascript
await htmx.swap({
  text: '<strong>Saved</strong>',
  target: '#status'
})
```

### `target`

The target element or selector. It defaults to `document.body`.

```javascript
await htmx.swap({
  text: 'Saved',
  target: document.querySelector('#status')
})
```

```javascript
await htmx.swap({
  text: 'Saved',
  target: '#status'
})
```

### `swap`

A serialized [`hx-swap`](/reference/attributes/hx-swap) value.

```javascript
await htmx.swap({
  text: 'Saved',
  target: '#status',
  swap: 'innerHTML transition:true settle:100ms'
})
```

It defaults to [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap).

### Other Fields

| Field | Description |
|---|---|
| `sourceElement` | Element used for relative selectors and swap events |
| `select` | Content selected from `text` |
| `selectOOB` | Out-of-band content selected from `text` |
| `transition` | Whether to use a view transition |

## Set the Source

Set `sourceElement` when a target or swap modifier uses a relative selector:

```javascript
let button = document.querySelector('#save')

await htmx.swap({
  text: 'Saved',
  target: 'closest .result',
  sourceElement: button
})
```

The source element also receives swap lifecycle events.

## Select Response Content

Use `select` to swap part of the content:

```javascript
await htmx.swap({
  text: '<p id="message">Saved</p><p>Ignored</p>',
  target: '#status',
  select: '#message'
})
```

Use `selectOOB` for [out-of-band content](/reference/attributes/hx-select-oob).

## Events

`htmx.swap()` fires:

- [`htmx:before:swap`](/reference/events/htmx-before-swap)
- [`htmx:before:settle`](/reference/events/htmx-before-settle)
- [`htmx:after:settle`](/reference/events/htmx-after-settle)
- [`htmx:after:swap`](/reference/events/htmx-after-swap)
- [`htmx:finally:swap`](/reference/events/htmx-finally-swap)

Swap events fire on `sourceElement`. Settle events fire on each swap target.

## Return Value

`htmx.swap()` returns a `Promise` that resolves after the swap finishes.

```javascript
await htmx.swap({
  text: 'Saved',
  target: '#result'
})
console.log('Swap complete')
```

## Notes

- `htmx.swap()` processes main, out-of-band, and `<hx-partial>` content.
- `htmx.swap()` does not issue a request.

## See Also

- [`htmx.ajax()`](/reference/methods/htmx-ajax)
- [`hx-swap`](/reference/attributes/hx-swap)
- [`hx-target`](/reference/attributes/hx-target)

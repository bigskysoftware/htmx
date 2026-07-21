---
title: "htmx.swap()"
description: "Swaps HTML content"
---

The `htmx.swap()` function runs the swap lifecycle without issuing a request.

## Syntax

```javascript
htmx.swap(content, target)
htmx.swap(content, target, swap)
htmx.swap(content, target, options)
```

```javascript
// Default swap
await htmx.swap('<p>Done</p>', '#result')

// Serialized swap
await htmx.swap(
  '<p>Done</p>',
  '#result',
  'outerHTML transition:true'
)

// Structured swap
await htmx.swap(
  '<p>Done</p>',
  '#result',
  {
    style: 'outerHTML',
    transition: true
  }
)
```

## Parameters

### `content`

The HTML string to swap.

```javascript
await htmx.swap('<strong>Saved</strong>', '#status')
```

### `target`

The target element or selector.

```javascript
await htmx.swap('Done', document.querySelector('#status'))
await htmx.swap('Done', '#status')
```

### `swap`

A serialized [`hx-swap`](/reference/attributes/hx-swap) specification.

```javascript
await htmx.swap(
  'Done',
  '#status',
  'innerHTML transition:true settle:100ms'
)
```

### `options`

An object with structured swap fields.

```javascript
await htmx.swap('Done', '#status', {
  style: 'innerHTML',
  transition: true,
  settleDelay: '100ms'
})
```

Use `swap` to combine serialized or structured swap input with other options:

```javascript
await htmx.swap('Done', '#status', {
  swap: 'innerHTML transition:true',
  source: '#save'
})
```

Flat swap fields override fields from `swap`.

Supported fields:

- `swap` - Serialized or structured swap input
- `style`
- [`select`](/reference/attributes/hx-select)
- [`selectOOB`](/reference/attributes/hx-select-oob)
- `transition`
- `swapDelay`
- `settleDelay`
- Other [`hx-swap` modifiers](/reference/attributes/hx-swap)
- `source`

## Source

Pass `source` when the swap needs an element for relative selectors or lifecycle events.

```javascript
let button = document.querySelector('#save')

await htmx.swap('Saved', 'closest .result', {
  swap: 'innerHTML transition:true',
  source: button
})
```

`source` accepts an element or selector. If omitted, the resolved target becomes the source.

## Events

`htmx.swap()` fires:

- [`htmx:before:swap`](/reference/events/htmx-before-swap)
- [`htmx:after:swap`](/reference/events/htmx-after-swap)
- [`htmx:finally:swap`](/reference/events/htmx-finally-swap)
- [`htmx:before:settle`](/reference/events/htmx-before-settle)
- [`htmx:after:settle`](/reference/events/htmx-after-settle)

Swap events fire on `source`. Settle events fire on the swap target.

## Return Value

Returns a `Promise` that resolves after the swap finishes.

```javascript
await htmx.swap('Saved', '#result')
console.log('Swap complete')
```

## Notes

- `content` and `target` come from the positional arguments.
- `source` is public input. Events expose it as `ctx.sourceElement`.
- `htmx.swap()` does not issue a request.
- `htmx.swap()` does not run response actions or update history.

## See Also

- [`htmx.ajax()`](/reference/methods/htmx-ajax)
- [`hx-swap`](/reference/attributes/hx-swap)
- [`hx-target`](/reference/attributes/hx-target)

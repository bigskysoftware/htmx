---
title: "htmx.ajax()"
description: "Issues an htmx request"
---

Use `htmx.ajax()` to issue a request from JavaScript with htmx request, response, and swap behavior.

```javascript
await htmx.ajax('GET', '/messages', '#messages')
```

htmx swaps the response into `#messages` and resolves the promise after the request finishes.

## Syntax

```javascript
htmx.ajax(method, url)
htmx.ajax(method, url, target)
htmx.ajax(method, url, options)
```

Pass a selector or element as the target:

```javascript
await htmx.ajax('GET', '/messages', '#messages')

await htmx.ajax(
  'GET',
  '/messages',
  document.querySelector('#messages')
)
```

Use an options object to configure the request and swap:

```javascript
await htmx.ajax('POST', '/messages', {
  target: '#messages',
  swap: 'beforeend',
  values: {
    body: 'Hello'
  }
})
```

## Parameters

### `method`

The HTTP method. Method names are case-insensitive.

```javascript
await htmx.ajax('GET', '/messages')
await htmx.ajax('post', '/messages')
await htmx.ajax('DELETE', '/messages/42')
```

### `url`

The request URL.

```javascript
await htmx.ajax('GET', '/messages?limit=10')
```

### `target`

Pass a selector or element as the third argument.

```javascript
await htmx.ajax('GET', '/messages', '#messages')
```

An unmatched target selector rejects the returned promise.

### `options`

Use an options object for more control. It accepts [request context](/docs#request-context) fields:

```javascript
await htmx.ajax('POST', '/messages', {
  source: '#new-message',
  target: '#messages',
  swap: 'beforeend',
  values: {
    body: 'Hello'
  },
  headers: {
    'X-Requested-By': 'compose-form'
  }
})
```

Supported fields include:

| Field | Description |
|---|---|
| `source` | Element or selector used for attributes, values, and lifecycle events |
| `event` | Event that triggered the request |
| `target` | Element or selector that receives the response |
| `swap` | Serialized [`hx-swap`](/reference/attributes/hx-swap) value |
| `select` | Content selected from the response |
| `selectOOB` | Out-of-band content selected from the response |
| `transition` | Whether to use a view transition |
| `values` | Values added to the request |
| `headers` | Request headers |

With no source or target, htmx uses `document.body`.

## Set the Source

Set `source` when the request should behave as if it came from an element:

```javascript
await htmx.ajax('POST', '/messages', {
  source: '#new-message',
  target: '#messages',
  swap: 'beforeend'
})
```

The source provides inherited htmx attributes, form values, and the element used for lifecycle events. An unmatched source selector rejects the returned promise.

If `target` is omitted, the source becomes the default target.

## Control the Swap

Pass a serialized [`hx-swap`](/reference/attributes/hx-swap) value with `swap`:

```javascript
await htmx.ajax('GET', '/messages', {
  target: '#messages',
  swap: 'innerHTML transition:true'
})
```

Select part of the response with `select`:

```javascript
await htmx.ajax('GET', '/messages', {
  target: '#messages',
  swap: 'innerHTML',
  select: '#unread'
})
```

Use `selectOOB` for [out-of-band content](/reference/attributes/hx-select-oob).

## Send Values

Pass request values with `values`:

```javascript
await htmx.ajax('POST', '/messages', {
  values: {
    body: 'Hello',
    draft: false
  }
})
```

For `GET` and `DELETE`, htmx adds the values to the URL query. Other methods send them in the request body.

A source form contributes its values automatically:

```javascript
await htmx.ajax('POST', '/messages', {
  source: '#new-message'
})
```

Explicit values replace form values with the same names.

## Set Headers

Pass request headers with `headers`:

```javascript
await htmx.ajax('GET', '/messages', {
  headers: {
    'X-Request-Source': 'inbox'
  }
})
```

## Pass the Event

Pass the triggering event when calling `htmx.ajax()` from an event listener:

```javascript
button.addEventListener('click', event => {
  htmx.ajax('POST', '/messages', {
    source: button,
    event
  })
})
```

## Return Value

`htmx.ajax()` returns a `Promise` that resolves after the request finishes.

```javascript
await htmx.ajax('GET', '/messages', '#messages')
console.log('Request complete')
```

## See Also

- [`htmx.swap()`](/reference/methods/htmx-swap)
- [`hx-swap`](/reference/attributes/hx-swap)
- [`hx-target`](/reference/attributes/hx-target)
- [`hx-select`](/reference/attributes/hx-select)

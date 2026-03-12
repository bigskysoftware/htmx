---
title: "htmx.ajax()"
description: "Issues an htmx-style ajax request"
---

The `htmx.ajax()` function issues an AJAX request with htmx semantics. It returns a `Promise` that resolves after the response content has been inserted into the DOM, allowing you to chain callbacks.

## Syntax

```javascript
htmx.ajax(method, url, element)   // swap target is a DOM element
htmx.ajax(method, url, selector)  // swap target is a CSS selector string
htmx.ajax(method, url, context)   // full context object
```

## Parameters

- `method` - HTTP method (GET, POST, PUT, PATCH, DELETE)
- `url` - URL to request
- `element` - A DOM element to use as the swap target
- `selector` - A CSS selector string identifying the swap target
- `context` - A configuration object with the following fields:
  - `source` - the source element of the request
  - `event` - an event that triggered the request
  - `handler` - a callback that will handle the response HTML
  - `target` - the target to swap the response into
  - `swap` - how the response will be swapped in relative to the target
  - `values` - values to submit with the request
  - `headers` - headers to submit with the request
  - `select` - allows you to select the content you want swapped from a response
  - `selectOOB` - allows you to select content for out-of-band swaps from a response

## Return Value

Returns a `Promise` that resolves after the content has been inserted into the DOM.

## Examples

```javascript
// Swap target as a CSS selector
htmx.ajax('GET', '/example', '#result')

// Full context object
htmx.ajax('GET', '/example', {
  target: '#result',
  swap: 'innerHTML'
})

// Promise-based callback after insertion
htmx.ajax('GET', '/example', '#result').then(() => {
  console.log('Content inserted successfully!');
})
```

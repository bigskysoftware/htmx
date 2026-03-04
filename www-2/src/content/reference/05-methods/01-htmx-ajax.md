---
title: "htmx.ajax()"
description: "Issues an htmx-style ajax request"
---

# **`htmx.ajax()`**

The `htmx.ajax()` function issues an AJAX request with htmx semantics.

## Syntax

```javascript
htmx.ajax(method, url, options)
```

## Parameters

- `method` - HTTP method (GET, POST, PUT, PATCH, DELETE)
- `url` - URL to request
- `options` - Configuration object with htmx options

## Example

```javascript
htmx.ajax('GET', '/example', {
  target: '#result',
  swap: 'innerHTML'
})
```

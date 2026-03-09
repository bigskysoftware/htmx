---
title: "htmx:config:request"
description: "Configure request before it's sent"
---

Fired after request parameters are built but before validation and sending.

## When It Fires

After htmx has constructed the request context but before `htmx:confirm` or `htmx:before:request`.

## Event Detail

The event provides a `ctx` object with the following structure:

```javascript
{
    sourceElement,  // Element that triggered the request
    sourceEvent,    // Event that triggered it
    target,         // Where the response will go
    select,         // hx-select value
    selectOOB,      // hx-select-oob value
    swap,           // hx-swap value
    push,           // hx-push-url value
    replace,        // hx-replace-url value
    transition,     // Whether to use view transitions
    request: {
        validate,     // Whether to validate the form
        action,       // Request URL
        method,       // HTTP method
        headers,      // Request headers object
        body,         // Request body (FormData)
        credentials,  // Fetch credentials mode
        mode,         // Fetch mode
        cache,        // Fetch cache mode
        timeout,      // Timeout in milliseconds
        // ... any other fetch options
    }
}
```

You can modify any property to change the request.

Call `evt.preventDefault()` to cancel the request.

## Examples

### Add authentication to all requests

```javascript
document.body.addEventListener('htmx:config:request', function(evt) {
    evt.detail.ctx.request.headers['X-Auth-Token'] = getAuthToken();
});
```

### Set longer timeout for specific endpoint

```javascript
htmx.on('htmx:config:request', (evt) => {
    if (evt.detail.ctx.request.action.includes('/slow-endpoint')) {
        evt.detail.ctx.request.timeout = 30000;
    }
});
```

### Include credentials for CORS requests

```javascript
document.body.addEventListener('htmx:config:request', function(evt) {
    if (evt.detail.ctx.request.action.startsWith('https://api.example.com')) {
        evt.detail.ctx.request.credentials = 'include';
        evt.detail.ctx.request.mode = 'cors';
    }
});
```

### Cancel request based on condition

```javascript
htmx.on('htmx:config:request', (evt) => {
    if (!isUserAuthorized()) {
        evt.preventDefault();
    }
});
```

## Notes

- This is the ideal place to modify request configuration globally
- Changes made here apply after `hx-config` attributes are processed
- Use this for cross-cutting concerns like authentication, logging, or global timeouts

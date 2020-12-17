---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `authentication-header` Extension

This extension listens for `Authentication` headers in HTTP responses, then stores this value in `sessionStorage` and injects it back in to outgoing HTTP requests.

This demonstrates how to use extensions to sign in to remote servers without using cookies.

### Usage

```html
<body hx-ext="authentication-header">
 ...
</body>
```

### Source

<https://unpkg.com/htmx.org/dist/ext/authentication-header.js>

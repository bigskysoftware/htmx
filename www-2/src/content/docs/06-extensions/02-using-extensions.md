---
title: "Using Extensions"
description: "Install and activate htmx extensions in your app"
---

# Using Extensions

In htmx 4, extensions hook into standard events rather than callback extension points. They are lightweight with no
performance penalty.

Extensions apply page-wide without requiring `hx-ext` on parent elements. They activate via custom attributes where
needed.

To restrict which extensions can register, use an allow list:

```html
<meta name="htmx:config" content='{"extensions": "my-ext,another-ext"}'>
```

### Core Extensions

htmx supports a few core extensions, which are supported by the htmx development team:

* [head-support](/extensions/head-support) - support for merging head tag information (styles, etc.) in htmx requests
* [ws](/extensions/ws) - support
  for [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)

You can see all available extensions on the [Extensions](/extensions) page.

### Creating Extensions

If you are interested in adding your own extension to htmx, please [see the extension docs](/extensions/building).

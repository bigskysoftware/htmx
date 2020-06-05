---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `ajax-header` Extension

This extension adds the X-Requested-With header to requests with the value "XMLHttpRequest".

This header is commonly used by javascript frameworks to differentiate ajax requests from normal http requests.

### Usage

```html
<body hx-ext="ajax-header">
 ...
</body>
```

### Source

<https://unpkg.com/htmx.org/dist/ext/ajax-header.js>

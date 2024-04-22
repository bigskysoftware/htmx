+++
title = "ajax-header"
+++

This extension adds the `X-Requested-With` header to requests with the value "XMLHttpRequest".

This header is commonly used by javascript frameworks to differentiate ajax requests from normal http requests.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/ajax-header.js"></script>
```

## Usage

```html
<body hx-ext="ajax-header">
 ...
</body>
```

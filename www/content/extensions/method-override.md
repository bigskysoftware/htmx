+++
title = "method-override"
+++

This extension makes non-`GET` and `POST` requests use a `POST` with the `X-HTTP-Method-Override` header set to the
actual HTTP method.  This is necessary when dealing with some firewall or proxy situations.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/method-override.js"></script>
```

### Usage

```html
<body hx-ext="method-override">
   <button hx-put="/update">
     This request will be made as a POST w/ the X-HTTP-Method-Override Header Set
</button>
</body>
```

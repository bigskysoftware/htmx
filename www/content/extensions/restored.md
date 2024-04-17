+++
title = "restored"
+++

This extension triggers an event ``restored`` whenever a back button even is detected while using ``hx-boost``.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/restored.js"></script>
```

## Usage
A page utilizing ``hx-boost`` that will reload the ``h1`` each time the back button is pressed:
```html
<body hx-boost="true">
    <h1 hx-ext="restored" hx-trigger="restored" hx-get="/header">Come back!</h1>
    <a href="/other_page">I'll be back</a>
</body>
```

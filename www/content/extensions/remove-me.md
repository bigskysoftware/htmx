+++
title = "remove-me"
+++

The `remove-me` extension allows you to remove an element after a specified interval.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/remove-me.js"></script>
```

## Usage

```html
<div hx-ext="remove-me">
    <!-- Removes this div after 1 second -->
    <div remove-me="1s">To Be Removed...</div>
</div>
```

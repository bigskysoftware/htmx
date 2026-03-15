---
title: "Optimistic UI"
description: "Optimistic UI updates that apply changes before the server responds"
keywords: ["optimistic", "ui", "instant", "updates"]
---

The `optimistic` extension enables optimistic UI updates, applying changes to the DOM immediately before the server responds. If the server request fails, the changes can be rolled back.

## Installing

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-optimistic.js"></script>
```

## Usage

The extension allows you to show the expected result of an action immediately, providing a snappier user experience. The actual server response will replace the optimistic update when it arrives.

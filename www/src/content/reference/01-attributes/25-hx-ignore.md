---
title: "hx-ignore"
description: "Disables htmx processing for the element"
---

The `hx-ignore` attribute disables htmx processing for an element and all its children.

## Syntax

```html
<div hx-ignore>
    <!-- htmx will not process any attributes here -->
</div>
```

The value of the tag is ignored, and it cannot be reversed by any content beneath it.

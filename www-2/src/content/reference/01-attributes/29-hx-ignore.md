---
title: "hx-ignore"
description: "Disable htmx processing for element"
---

The [`hx-disable`](/reference/attributes/hx-disable) attribute will disable htmx processing for a given element and all its children. This can be
useful as a backup for HTML escaping, when you include user generated content in your site, and you want to
prevent malicious scripting attacks.

## Syntax

```html
<div hx-ignore>
    <!-- htmx will not process any attributes here -->
</div>
```

The value of the tag is ignored, and it cannot be reversed by any content beneath it.

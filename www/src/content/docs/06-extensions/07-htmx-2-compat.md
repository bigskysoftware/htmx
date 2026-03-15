---
title: "htmx 2.x Compatibility"
description: "Compatibility layer for running htmx 2.x code on htmx 4"
keywords: ["compatibility", "migration", "htmx 2", "legacy"]
---

The `htmx-2-compat` extension provides a compatibility layer that allows htmx 2.x code to run on htmx 4 with minimal changes. This is useful for gradual migration of existing applications.

## Installing

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-htmx-2-compat.js"></script>
```

## Usage

Once loaded, the extension maps old htmx 2.x APIs and behaviors to their htmx 4 equivalents, including:

- Old event names (e.g., `htmx:afterSwap` → [`htmx:after:swap`](/reference/events/htmx-after-swap))
- Implicit attribute inheritance (without requiring `:inherited` modifier)
- The `hx-ext` attribute for activating extensions
- Other htmx 2.x behaviors that changed in htmx 4

See the [Migration guide](/docs/get-started/migration) for a full list of changes between htmx 2.x and htmx 4.

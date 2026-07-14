---
title: "hx-alpine-compat"
description: "Run htmx alongside Alpine.js without conflicts"
category: "Compatibility"
icon: "icon-[simple-icons--alpinedotjs]"
keywords: ["alpine", "alpinejs", "compatibility", "integration", "history"]
---

The `alpine-compat` extension provides a compatibility layer between htmx and [Alpine.js](https://alpinejs.dev/), ensuring Alpine components are correctly initialized and preserved across htmx-driven DOM updates.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-alpine-compat.js"></script>
<script defer src="/path/to/alpine.js"></script>
```

Alpine must load **after** the extension script. The `defer` attribute ensures this.

## What it does

### Alpine initialization on swap

htmx's settle phase introduces a brief pause after swapping content to allow CSS transitions to run. Alpine's mutation observer fires during this window and sees the intermediate DOM state, causing components to initialize against incomplete or transitioning content. The extension defers Alpine's mutation observer before the swap and flushes it only after the settle phase completes, so Alpine always initializes against the final stable DOM.

### Morph-aware state preservation

When using `innerMorph` or `outerMorph` swap styles, htmx reconciles the existing DOM with new content rather than replacing it. The extension hooks into `htmx:before:morph:node` to carry Alpine's reactive data stack from the old node to the new one before morphing, preventing Alpine state from being lost during reconciliation. This replaces the need for Alpine's native morph extension.

### Alpine ID binding compatibility

Alpine can bind reactive values to an element's `id` attribute via `:id` or `x-bind:id`. This causes the morph algorithm to see mismatched IDs and treat matching elements as different nodes. The extension overrides the soft-match check to ignore ID mismatches when both nodes have Alpine-reactive ID bindings, keeping the morph stable.

## Combining with `history-cache`

When used alongside the [`hx-history-cache`](/extensions/hx-history-cache) extension, `alpine-compat` also handles saving and restoring Alpine component state across history navigation.

### How it works

Before a page is saved to the history cache, the extension serializes each Alpine component's reactive data to a `data-alpine-state` attribute, then tears down the Alpine tree so the snapshot is clean HTML. On restore, it re-applies the saved values back into the live Alpine data stack after Alpine has re-initialized the restored content.
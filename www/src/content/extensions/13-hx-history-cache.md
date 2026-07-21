---
title: "hx-history-cache"
description: "Restore back/forward pages from `sessionStorage`"
category: "Performance"
icon: "icon-[mdi--history]"
keywords: ["history", "cache", "sessionStorage", "back", "forward", "navigation"]
---

The `history-cache` extension replaces htmx's default history handling with a client-side cache stored in `sessionStorage`. When the user navigates back or forward, the extension restores the page instantly from cache instead of fetching from the server.

## Installing

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-history-cache.js"></script>
```

## Usage

No markup changes are required. Once the script is loaded, all htmx-driven navigation is cached automatically.

To exclude a page from being saved to the cache, add `hx-history="false"` anywhere in the document:

```html
<div hx-history="false">
  <!-- This page will not be saved to the history cache -->
</div>
```

## Configuration

All options live under `htmx.config.historyCache` and can be set via a meta tag:

```html
<meta name="htmx-config" content='{"historyCache": {"size": 20, "refreshOnMiss": true}}'>
```

To use morphing for smoother restores:

```html
<meta name="htmx-config" content='{"historyCache": {"swapStyle": "outerMorph"}}'>
```

| Option | Default | Description |
|--------|---------|-------------|
| `size` | `10` | Maximum number of pages to keep in the cache. Oldest entries are evicted first. Set to `0` to disable caching entirely. |
| `refreshOnMiss` | `false` | When `true`, forces a full page reload if the requested history entry is not in the cache. |
| `disable` | `false` | Disables the extension without unloading it. |
| `swapStyle` | `"outerSync"` | The htmx swap style used when restoring cached content. Defaults to `outerSync`, which preserves the target element in the DOM (keeping listeners and component state) while syncing its attributes and replacing its children. Use `innerHTML` to replace children only without syncing attributes. Can be set to `"innerMorph"` or `"outerMorph"` for smooth DOM diffing. |

## Events

The extension fires the following events on `document`:

| Event                               | Detail                             | Description                                                                                                                                           |
|-------------------------------------|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx:history:cache:before:save`    | `{ target, head }`                 | Fired before saving the current page. Cancel the event to skip saving. The target DOM and `detail.head` may be changed before the snapshot is stored. |
| `htmx:history:cache:after:save`     | `{ content, head, scroll, title }` | Fired after a page is saved.                                                                                                                          |
| `htmx:history:cache:miss`           | `{ path, refreshOnMiss }`          | Fired when the requested history entry is not in the cache. Set `detail.refreshOnMiss = true` to force a reload.                                      |
| `htmx:history:cache:hit`            | `{ path, item }`                   | Fired when a cache entry is found. Cancel the event to bypass the cache and let htmx fetch from the server.                                           |
| `htmx:history:cache:before:restore` | `{ head, ready }`                  | Fired before cached content is restored. Set `detail.ready` to a promise to delay the body restore.                                                   |
| `htmx:history:cache:after:restore`  | `{ item }`                         | Fired after cached content, title, scroll, and annotated state are restored.                                                                          |

### Example: Skipping the cache for specific paths

```javascript
document.addEventListener('htmx:history:cache:before:save', (evt) => {
    if (location.pathname.startsWith('/admin')) {
        evt.preventDefault();
    }
});
```

### Example: Handling a cache miss

```javascript
document.addEventListener('htmx:history:cache:miss', (evt) => {
    console.log('Cache miss for', evt.detail.path);
    evt.detail.refreshOnMiss = true; // reload instead of fetching via htmx
});
```

### Example: Inspecting a cache hit before restore

```javascript
document.addEventListener('htmx:history:cache:hit', (evt) => {
    if (isStale(evt.detail.item)) {
        return false; // bypass cache, let htmx fetch fresh content
    }
});
```

## Head Restoration

By default the extension saves the `<head>` snapshot but does not restore it. Including the [`hx-head`](/extensions/hx-head) extension enables full `<head>` restoration on cache hits. Stylesheets and blocking scripts are ready before the body restore. Deferred scripts run after the body swap, before cached title, scroll, and form state are restored.

```html
<script src="/path/to/ext/hx-history-cache.js"></script>
<script src="/path/to/ext/hx-head.js"></script>
```

## How It Works

1. **Before navigation** (`htmx:before:history:update`): the current page's HTML, `<head>`, title, and scroll position are serialised and written to `sessionStorage`.
2. **On back/forward** (`htmx:before:history:restore`): the extension looks up the target path in the cache.
   - **Hit**: fires `htmx:history:cache:hit`, cancels the core network path, and restores content via `htmx.swap()`. If `hx-head` is loaded, it coordinates head restoration through the cache before-restore event and the normal swap lifecycle.
   - **Miss**: fires `htmx:history:cache:miss`. If `refreshOnMiss` is set the page reloads; otherwise core handles the fetch normally.
3. **Cache eviction**: when the cache exceeds `size`, the oldest entry is dropped. If `sessionStorage` is full, entries are dropped from the front until the write succeeds.

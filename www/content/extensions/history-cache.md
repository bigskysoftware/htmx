+++
title = "htmx History Cache Extension"
+++

The `history-cache` extension replaces htmx's default history handling with a client-side cache stored in `sessionStorage`. When the user navigates back or forward, the extension restores the page instantly from cache instead of fetching from the server.

## Installing

### Via CDN

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha7/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha7/dist/ext/hx-history-cache.js"></script>
```

### Download

```html
<script src="/path/to/htmx.min.js"></script>
<script src="/path/to/hx-history-cache.js"></script>
```

### npm

```sh
npm install htmx.org@4.0.0-alpha7
```

```html
<script src="node_modules/htmx.org/dist/htmx.min.js"></script>
<script src="node_modules/htmx.org/dist/ext/hx-history-cache.js"></script>
```

### Module Imports

```javascript
import htmx from 'htmx.org';
import 'htmx.org/dist/ext/hx-history-cache';
```

The extension registers automatically when loaded. No `hx-ext` attribute is needed in htmx 4.

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
<meta name="htmx-config" content='{"historyCache": {"swapStyle": "innerMorph"}}'>
```

| Option | Default | Description |
|--------|---------|-------------|
| `size` | `10` | Maximum number of pages to keep in the cache. Oldest entries are evicted first. Set to `0` to disable caching entirely. |
| `refreshOnMiss` | `false` | When `true`, forces a full page reload if the requested history entry is not in the cache. |
| `disable` | `false` | Disables the extension without unloading it. |
| `swapStyle` | `"innerHTML"` | The htmx swap style used when restoring cached content. Can be set to `"innerMorph"` for smooth DOM diffing instead of a full replacement. |

## Events

The extension fires the following events on `document`:

| Event | Detail | Description |
|-------|--------|-------------|
| `htmx:history:cache:before:save` | `{ path, target, cache }` | Fired before saving the current page. Return `false` or set `detail.cancelled` to skip saving. Mutations to `path`, `target`, and `cache` are respected. |
| `htmx:history:cache:after:save` | `{ path, item, cache }` | Fired after a page is successfully saved. |
| `htmx:history:cache:miss` | `{ path, refreshOnMiss }` | Fired when the requested history entry is not in the cache. Set `detail.refreshOnMiss = true` to force a reload. |
| `htmx:history:cache:hit` | `{ path, item }` | Fired when a cache entry is found. Return `false` to cancel the cache restore and let htmx fetch from the server instead. |
| `htmx:history:cache:restored` | `{ path, item, head }` | Fired after content has been restored from the cache. |

### Example: Skipping the cache for specific paths

```javascript
document.addEventListener('htmx:history:cache:before:save', (evt) => {
    if (evt.detail.path.startsWith('/admin')) {
        evt.detail.cancelled = true;
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

By default the extension saves the `<head>` snapshot but does not restore it. Including the [`head-support`](/extensions/head-support) extension enables full `<head>` restoration on cache hits — styles, scripts, and meta tags are merged back in alongside the body content.

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha7/dist/ext/hx-history-cache.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha7/dist/ext/hx-head-support.js"></script>
```

## How It Works

1. **Before navigation** (`htmx_before_history_update`): the current page's HTML, `<head>`, title, and scroll position are serialised and written to `sessionStorage`.
2. **On back/forward** (`htmx_before_restore_history`): the extension looks up the target path in the cache.
   - **Hit**: fires `htmx:history:cache:hit`, sets `detail.cancelled = true`, and restores content via `htmx.swap()`. Core never makes a network request. If `head-support` is loaded, the saved `<head>` is also restored via `htmx:history:cache:restored`.
   - **Miss**: fires `htmx:history:cache:miss`. If `refreshOnMiss` is set the page reloads; otherwise core handles the fetch normally.
3. **Cache eviction**: when the cache exceeds `size`, the oldest entry is dropped. If `sessionStorage` is full, entries are dropped from the front until the write succeeds.


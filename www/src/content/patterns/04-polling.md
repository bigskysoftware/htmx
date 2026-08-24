---
includeMockServer: true
title: "Polling"
description: Check for updates at regular intervals
category: "Real-time"
icon: "icon-[mdi--reload]"
---

<script>
var _live = true;
var _cpu = 34, _mem = 61, _reqs = 1284;

function _tick() {
    _cpu = Math.max(4, Math.min(96, _cpu + Math.round((Math.random() - 0.5) * 22)));
    _mem = Math.max(18, Math.min(92, _mem + Math.round((Math.random() - 0.5) * 8)));
    _reqs = _reqs + 3 + Math.floor(Math.random() * 40);
}

function _meter(label, value) {
    return `<div class="flex flex-col gap-1.5">
        <div class="flex items-baseline justify-between">
            <span class="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">${label}</span>
            <span class="text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-100">${value}%</span>
        </div>
        <div class="w-full h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800" role="progressbar"
             aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}">
            <div class="h-full rounded-full bg-neutral-800 dark:bg-neutral-300 origin-left transition-transform duration-500 ease-out" style="transform:scaleX(${value / 100})"></div>
        </div>
    </div>`;
}

function _statusView() {
    // When paused, omit the polling attributes so the morph tears down the interval.
    let polling = _live ? 'hx-get="/status" hx-trigger="every 2s" hx-swap="outerMorph"' : '';
    return `<div id="server-status" class="w-full flex flex-col gap-4 starting:opacity-0 transition duration-300" ${polling}>
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="inline-block size-2 rounded-full ${_live ? 'bg-green-500 animate-pulse' : 'bg-neutral-400 dark:bg-neutral-600'}"></span>
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-200" role="status">${_live ? 'Live' : 'Paused'}</span>
            </div>
            <button class="flex items-center gap-1.5 text-[0.8125rem] text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer transition"
                    hx-post="/toggle" hx-target="#server-status" hx-swap="outerMorph">
                <i class="${_live ? 'icon-[mdi--pause]' : 'icon-[mdi--play]'} size-3.5"></i> ${_live ? 'Pause' : 'Resume'}
            </button>
        </div>
        <div class="grid grid-cols-2 gap-5">
            ${_meter('CPU', _cpu)}
            ${_meter('Memory', _mem)}
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">${_reqs.toLocaleString()} requests served</p>
    </div>`;
}

server.get("/demo", () => _statusView());
server.get("/status", () => { _tick(); return _statusView(); });
server.post("/toggle", () => { _live = !_live; if (_live) _tick(); return _statusView(); });

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex flex-col justify-center min-h-[190px]"></div>

## Basic usage

Add an [`every <time>`](/reference/attributes/hx-trigger#every-time) trigger to poll an endpoint.

```html
<div id="server-status" hx-get="/status" hx-trigger="every 2s" hx-swap="outerMorph">
  <span>CPU 34%</span>
</div>
```

- [`hx-trigger`](/reference/attributes/hx-trigger)=`"every 2s"` fires a request every two seconds.
- [`hx-swap`](/reference/attributes/hx-swap)=`"outerMorph"` replaces the element with the response. A morph keeps focus, scroll position, and CSS transitions intact.

The server returns the same element with fresh data:

```html
<div id="server-status" hx-get="/status" hx-trigger="every 2s" hx-swap="outerMorph">
  <span>CPU 61%</span>
</div>
```

The interval unit is `ms`, `s`, or `m`. A bare number is milliseconds.

```html
<div hx-get="/status" hx-trigger="every 500ms">...</div>
<div hx-get="/status" hx-trigger="every 1m">...</div>
```

## Stopping the poll

htmx clears the interval when the element leaves the DOM. To stop the poll, return the element without the trigger attributes.

```html
<!-- server response when there is nothing more to watch -->
<div id="server-status">
  <span>Job complete</span>
</div>
```

The demo above uses this to pause. The Pause button posts to `/toggle`, and the server renders the card without `hx-get` and `hx-trigger`.

## Conditional polling

Add a [filter](/reference/attributes/hx-trigger#filter) after the interval. The request only fires when the expression is true.

```html
<div hx-get="/status"
     hx-trigger="every 2s [document.visibilityState === 'visible']"
     hx-swap="outerMorph">
  ...
</div>
```

This stops network traffic while the tab is in the background. The interval still runs, so the poll resumes as soon as the user comes back.

## Notes

### Load polling

To poll only until a job ends, use [`hx-trigger="load delay:1s"`](/reference/attributes/hx-trigger#load) instead of `every`. The server controls each next request, and the poll ends when the response omits the trigger. See [Progress Bar](/patterns/progress-bar) for a full example.

### Skip unchanged responses

Each poll costs a full response body even when nothing changed. The [`hx-ptag`](/extensions/hx-ptag) extension adds a per-element tag. The server compares the incoming tag, then returns `304 Not Modified`, and htmx skips the swap.

### Choose an interval

Each poll is a full request. A 1 second interval on a page with 1000 users is 1000 requests per second. Poll no faster than the data changes.

For high-frequency updates, a persistent connection costs less. See the [`hx-sse`](/extensions/hx-sse) extension.

### Overlapping requests

htmx queues requests for the same element, and keeps at most one waiting. A slow response does not stack up parallel requests. Use [`hx-sync`](/reference/attributes/hx-sync) to change this.

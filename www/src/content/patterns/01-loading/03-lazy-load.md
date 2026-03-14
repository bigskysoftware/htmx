---
title: "Lazy Load"
description: Load content after the page renders
icon: "icon-[bitcoin-icons--visible-filled]"
---

<script>
const label = "text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400";
const temp = "text-lg font-semibold text-neutral-800 dark:text-neutral-100";
const desc = "text-xs text-neutral-500 dark:text-neutral-400";
const fade = "starting:opacity-0 starting:translate-y-1 transition";
const day = `flex flex-col items-center gap-1 py-3 px-2 rounded-md starting:opacity-0 starting:translate-y-1 hover:bg-neutral-50 dark:hover:bg-neutral-850`;

server.get("/demo", () => `
<div hx-get="/weather" hx-trigger="load" hx-swap="outerHTML">
  <div class="size-full flex items-center justify-center gap-2 text-sm starting:opacity-0 transition">
    <span class="inline-block size-4 border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-400 dark:border-t-neutral-400 rounded-full animate-spin"></span>
    Loading forecast…
  </div>
</div>`);

server.get("/weather", () => ({ delay: 600, body: `
<div class="size-full">
  <div class="${fade} flex items-center gap-2 mb-4">
    <span class="text-xl">&#9729;</span>
    <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-200">5-Day Forecast</span>
  </div>
  <div class="grid grid-cols-5 gap-1 text-center">
    <div class="${day}" style="transition:opacity 300ms ease-out 50ms,transform 300ms ease-out 50ms,background-color 150ms ease 0ms"><span class="${label}">Mon</span><span class="${temp}">72°</span><span class="${desc}">Sunny</span></div>
    <div class="${day}" style="transition:opacity 300ms ease-out 100ms,transform 300ms ease-out 100ms,background-color 150ms ease 0ms"><span class="${label}">Tue</span><span class="${temp}">68°</span><span class="${desc}">Cloudy</span></div>
    <div class="${day}" style="transition:opacity 300ms ease-out 150ms,transform 300ms ease-out 150ms,background-color 150ms ease 0ms"><span class="${label}">Wed</span><span class="${temp}">65°</span><span class="${desc}">Rain</span></div>
    <div class="${day}" style="transition:opacity 300ms ease-out 200ms,transform 300ms ease-out 200ms,background-color 150ms ease 0ms"><span class="${label}">Thu</span><span class="${temp}">70°</span><span class="${desc}">Partly cloudy</span></div>
    <div class="${day}" style="transition:opacity 300ms ease-out 250ms,transform 300ms ease-out 250ms,background-color 150ms ease 0ms"><span class="${label}">Fri</span><span class="${temp}">74°</span><span class="${desc}">Sunny</span></div>
  </div>
</div>` }));
</script>

<div hx-get="/demo" hx-trigger="load" class="not-prose demo-container flex justify-center min-h-[218px]"></div>

## Basic usage

On the client, put a placeholder where the content will go.

```html
<div hx-get="/weather" hx-trigger="load">
  Loading...
</div>
```

- [`hx-get`](/reference/attributes/hx-get)=`/weather` might query a database or call an external API.
- [`hx-trigger`](/reference/attributes/hx-trigger)=[`"load"`](/reference/attributes/hx-trigger#load) fires the request as soon as the element enters the DOM.

On the server, respond with the HTML content. htmx swaps it into the placeholder when it arrives.

```html
<div class="forecast">
  <h3>5-Day Forecast</h3>
  <p>Monday: 72° Sunny</p>
  <p>Tuesday: 68° Cloudy</p>
</div>
```

## Multiple sections

Each placeholder loads independently. Your page renders fast even if several sections are slow:

```html
<div hx-get="/dashboard/sales" hx-trigger="load">
  Loading sales...
</div>

<div hx-get="/dashboard/analytics" hx-trigger="load">
  Loading analytics...
</div>

<div hx-get="/dashboard/notifications" hx-trigger="load">
  Loading notifications...
</div>
```

All three requests fire in parallel when the page loads.

## Notes

### Layout shift

When the response swaps in, it can push content below it down. This is known as [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls) and affects your [Lighthouse](https://developer.chrome.com/docs/lighthouse) score.

Reserve space with `min-height`:

```html
<div hx-get="/weather" hx-trigger="load" style="min-height: 200px">
  Loading...
</div>
```

The demo above does exactly this.

### Infinite loops

Be careful when including `hx-trigger="load"` in the server response.

```
load → GET /weather → response has hx-trigger="load" → load → GET /weather → …
```

If the response requests the same endpoint, it can create an infinite loop.

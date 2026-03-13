---
title: "Lazy Load"
description: Load content after the page renders
icon: "icon-[bitcoin-icons--visible-filled]"
---
This pattern loads content after the page renders using `hx-trigger="load"`. The browser fires the request as soon as the element enters the DOM, letting you defer heavy content until it is actually needed.

A placeholder element triggers a `GET` on load:

```html
<div hx-get="/weather" hx-trigger="load">
  <div class="loading-placeholder">Loading...</div>
</div>
```

htmx replaces the placeholder with the server response. A settling CSS transition fades the new content in smoothly:

```css
.htmx-settling > div { opacity: 0; }
#demo-content div { transition: opacity 300ms ease-in; }
```

_During the settle phase htmx briefly adds `.htmx-settling` to the parent, starting the element at `opacity: 0`. The transition then eases it to full visibility._

<script>
const label = "text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400";
const temp = "text-lg font-semibold text-neutral-800 dark:text-neutral-100";
const desc = "text-xs text-neutral-500 dark:text-neutral-400";
const fade = "starting:opacity-0 starting:translate-y-1 transition-all duration-300 ease-out";
const day = `flex flex-col items-center gap-1 py-3 px-2 rounded-md transition-all duration-300 ease-out starting:opacity-0 starting:translate-y-1 hover:bg-neutral-50 dark:hover:bg-neutral-850`;

// Fixed height prevents layout shift when content swaps in
server.get("/demo", () => `
<div class="h-[160px]" hx-get="/weather" hx-trigger="load" hx-swap="innerHTML settle:300ms">
  <div class="h-full flex items-center justify-center gap-2 text-sm starting:opacity-0 transition-opacity duration-500 ease-out">
    <span class="inline-block size-4 border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-400 dark:border-t-neutral-400 rounded-full animate-spin"></span>
    Loading forecast…
  </div>
</div>`);

server.get("/weather", () => ({ delay: 600, body: `
<div>
  <div class="${fade} flex items-center gap-2 mb-4">
    <span class="text-xl">&#9729;</span>
    <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-200">5-Day Forecast</span>
  </div>
  <div class="grid grid-cols-5 gap-1 text-center">
    <div class="${day}" style="transition-delay:50ms"><span class="${label}">Mon</span><span class="${temp}">72°</span><span class="${desc}">Sunny</span></div>
    <div class="${day}" style="transition-delay:100ms"><span class="${label}">Tue</span><span class="${temp}">68°</span><span class="${desc}">Cloudy</span></div>
    <div class="${day}" style="transition-delay:150ms"><span class="${label}">Wed</span><span class="${temp}">65°</span><span class="${desc}">Rain</span></div>
    <div class="${day}" style="transition-delay:200ms"><span class="${label}">Thu</span><span class="${temp}">70°</span><span class="${desc}">Partly cloudy</span></div>
    <div class="${day}" style="transition-delay:250ms"><span class="${label}">Fri</span><span class="${temp}">74°</span><span class="${desc}">Sunny</span></div>
  </div>
</div>` }));

server.start("/demo");
</script>

<style>
#demo-content .htmx-settling > div { opacity: 0; }
#demo-content div { transition: opacity 300ms ease-in; }
</style>

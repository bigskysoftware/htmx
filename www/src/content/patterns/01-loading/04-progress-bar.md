---
title: "Progress Bar"
description: Show progress bar during background job
icon: "icon-[vaadin--progressbar]"
---

<script>
const job = { complete: false, percentComplete: 0 };

const resetJob = () => {
    job.complete = false;
    job.percentComplete = 0;
};

const advanceJob = () => {
    job.percentComplete = Math.min(100, job.percentComplete + 8 + Math.floor(8 * Math.random()));
    job.complete = job.percentComplete >= 100;
};

const progressBar = () =>
    `<div class="flex flex-col items-center gap-2 w-full">
        <div class="w-full h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800" role="progressbar"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="${job.percentComplete}">
            <div id="pb" class="w-full h-full rounded-full bg-neutral-800 dark:bg-neutral-300 origin-left transition-transform duration-[400ms] ease-in-out" style="transform:scaleX(${job.percentComplete / 100})"></div>
        </div>
        <span class="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">${job.percentComplete}%</span>
    </div>`;

const jobView = () =>
    `<div id="job-status" class="flex flex-col items-center justify-center gap-4 w-full"
          hx-trigger="every 400ms" hx-get="/job/progress" hx-swap="outerMorph">
        <div class="flex items-center justify-between w-full">
            <p class="text-sm font-medium text-neutral-700 dark:text-neutral-200" role="status">${job.complete ? 'Complete' : 'Processing\u2026'}</p>
            <button class="flex items-center gap-1.5 text-[0.8125rem] text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer transition duration-300 ${job.complete ? 'opacity-100' : 'opacity-0 pointer-events-none'}"
                    hx-post="/start" hx-target="#job-status" hx-swap="outerMorph" ${job.complete ? '' : 'tabindex="-1"'}><i class="icon-[mdi--refresh] size-3.5"></i> Run again</button>
        </div>
        <div class="w-full">${progressBar()}</div>
    </div>`;

server.get("/demo", () =>
    `<div id="progress-demo" class="starting:opacity-0 transition duration-300 ease-out flex flex-col items-center justify-center text-center">
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Simulates a background job with server polling.</p>
        <button class="text-sm font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-md px-5 py-2 cursor-pointer transition hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-800 dark:hover:text-neutral-100 active:scale-[0.98]"
                hx-post="/start" hx-target="#progress-demo" hx-swap="outerMorph">
            Start Job
        </button>
    </div>`);

server.post("/start", () => { resetJob(); return jobView(); });

server.get("/job/progress", () => {
    advanceJob();
    return { body: jobView(), status: job.complete ? 286 : 200 };
});

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex flex-col justify-center min-h-[191px]"></div>

## Basic usage

On the client, a button starts the job.

```html
<button hx-post="/start" hx-swap="outerMorph">
  Start Job
</button>
```

On the server, respond with a container that polls for progress:

```html
<div hx-trigger="every 400ms"
     hx-get="/job/progress"
     hx-swap="outerMorph">
  ...progress bar...
</div>
```

- [`hx-trigger`](/reference/attributes/hx-trigger)=[`"every 400ms"`](/reference/attributes/hx-trigger#polling) polls the server on an interval.
- [`outerMorph`](/reference/attributes/hx-swap#outermorph) morphs the element in place, so CSS transitions on `transform` animate smoothly.

Each poll returns updated progress. When done, the server responds with [HTTP 286](https://en.wikipedia.org/wiki/86_(term)) to stop polling.

## Notes

### Use `transform` instead of `width`

Animating `width` causes [layout recalculation](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing). Use `transform: scaleX()` instead ([GPU-composited](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count), no layout thrashing):

```css
.bar {
  width: 100%;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 400ms ease-in-out;
}
```

The server returns `style="transform: scaleX(0.65)"` instead of `style="width: 65%"`. Same look, no layout thrashing. The demo above uses this approach.

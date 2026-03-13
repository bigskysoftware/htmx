---
title: "Progress Bar"
description: Show progress bar during background job
icon: "icon-[vaadin--progressbar]"
---

This pattern shows a smoothly animated progress bar driven by server polling.

A button `POST`s to `/start`, which kicks off a background job and replaces the button with a polling progress bar:

```html
<div hx-get="/job/progress"
     hx-trigger="every 600ms"
     hx-target="this"
     hx-swap="innerHTML">
    <div class="progress" role="progressbar"
         aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div id="pb" class="progress-bar" style="width:0%"></div>
    </div>
</div>
```

Every 600ms the inner `div` is replaced with an updated width. Because the progress bar has a stable `id`, htmx settles the `style` attribute smoothly. A CSS `transition` on `width` makes the animation continuous rather than jumpy.

When the job finishes, the server sends an `HX-Trigger: done` header. The outer wrapper listens for that event and swaps in the final "Complete" state with a restart button.

The key CSS for the progress bar:

```css
#demo-content .progress-bar {
    width: 0%;
    height: 100%;
    background: #2563eb;
    transition: width 0.6s ease;
}
```

<style>
#demo-content .progress {
    height: 20px;
    margin-bottom: 20px;
    overflow: hidden;
    background-color: #e5e5e5;
    border-radius: 6px;
}
:is(.dark) #demo-content .progress {
    background-color: #2a2a2a;
}
#demo-content .progress-bar {
    width: 0%;
    height: 100%;
    border-radius: 6px;
    background: #2563eb;
    transition: width 0.6s ease;
}
:is(.dark) #demo-content .progress-bar {
    background: #3b82f6;
}
@keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
}
#demo-content #restart-btn {
    animation: fade-in 0.4s ease-in 0.3s both;
}
</style>

<script>
const job = { complete: false, percentComplete: 0 };

const resetJob = () => {
    job.complete = false;
    job.percentComplete = 0;
};

const advanceJob = () => {
    job.percentComplete = Math.min(100, job.percentComplete + Math.floor(33 * Math.random()));
    job.complete = job.percentComplete >= 100;
};

const progressBar = () =>
    `<div class="progress" role="progressbar"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="${job.percentComplete}">
        <div id="pb" class="progress-bar" style="width:${job.percentComplete}%"></div>
    </div>`;

const restartBtn = () => job.complete
    ? `<button id="restart-btn" class="btn primary" hx-post="/start">Restart Job</button>`
    : "";

const statusView = () =>
    `<div hx-trigger="done" hx-get="/job" hx-swap="outerHTML" hx-target="this">
        <h3 role="status" id="pblabel" tabindex="-1" autofocus>${job.complete ? "Complete" : "Running"}</h3>
        <div hx-get="/job/progress"
             hx-trigger="${job.complete ? 'none' : 'every 600ms'}"
             hx-target="this"
             hx-swap="innerHTML">
            ${progressBar()}
        </div>
        ${restartBtn()}
    </div>`;

server.get("/demo", () =>
    `<div hx-target="this" hx-swap="outerHTML">
        <h3>Start Progress</h3>
        <button class="btn primary" hx-post="/start">Start Job</button>
    </div>`);

server.post("/start", () => { resetJob(); return statusView(); });

server.get("/job", () => statusView());

server.get("/job/progress", () => {
    advanceJob();
    if (job.complete) {
        return { body: progressBar(), headers: { "HX-Trigger": "done" } };
    }
    return progressBar();
});

server.start("/demo");
</script>

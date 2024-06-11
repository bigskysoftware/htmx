+++
title = "Progress Bar"
template = "demo.html"
+++

This example shows how to implement a smoothly scrolling progress bar.

We start with an initial state with a button that issues a `POST` to `/start` to begin the job:

```html
<div hx-target="this" hx-swap="outerHTML">
  <h3>Start Progress</h3>
  <button class="btn" hx-post="/start">
            Start Job
  </button>
</div>
```

This div is then replaced with a new div containing status and a progress bar that reloads itself every 600ms:

```html
<div hx-trigger="done" hx-get="/job" hx-swap="outerHTML" hx-target="this">
  <h3 role="status" id="pblabel" tabindex="-1" autofocus>Running</h3>

  <div
    hx-get="/job/progress"
    hx-trigger="every 600ms"
    hx-target="this"
    hx-swap="innerHTML">
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-labelledby="pblabel">
      <div id="pb" class="progress-bar" style="width:0%">
    </div>
  </div>
</div>

```

This progress bar is updated every 600 milliseconds, with the "width" style attribute and `aria-valuenow` attributed set to current progress value.
Because there is an id on the progress bar div, htmx will smoothly transition between requests by settling the
style attribute into its new value.  This, when coupled with CSS transitions, makes the visual transition continuous
rather than jumpy.

Finally, when the process is complete, a server returns `HX-Trigger: done` header, which triggers an update of the UI to "Complete" state
with a restart button added to the UI (we are using the [`class-tools`](https://github.com/bigskysoftware/htmx-extensions/blob/main/src/class-tools/README.md) extension in this example to add fade-in effect on the button):

```html
<div hx-trigger="done" hx-get="/job" hx-swap="outerHTML" hx-target="this">
  <h3 role="status" id="pblabel" tabindex="-1" autofocus>Complete</h3>

  <div
    hx-get="/job/progress"
    hx-trigger="none"
    hx-target="this"
    hx-swap="innerHTML">
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="122" aria-labelledby="pblabel">
        <div id="pb" class="progress-bar" style="width:122%">
      </div>
    </div>
  </div>

  <button id="restart-btn" class="btn" hx-post="/start" classes="add show:600ms">
    Restart Job
  </button>
</div>
```

This example uses styling cribbed from the bootstrap progress bar:

```css
.progress {
    height: 20px;
    margin-bottom: 20px;
    overflow: hidden;
    background-color: #f5f5f5;
    border-radius: 4px;
    box-shadow: inset 0 1px 2px rgba(0,0,0,.1);
}
.progress-bar {
    float: left;
    width: 0%;
    height: 100%;
    font-size: 12px;
    line-height: 20px;
    color: #fff;
    text-align: center;
    background-color: #337ab7;
    -webkit-box-shadow: inset 0 -1px 0 rgba(0,0,0,.15);
    box-shadow: inset 0 -1px 0 rgba(0,0,0,.15);
    -webkit-transition: width .6s ease;
    -o-transition: width .6s ease;
    transition: width .6s ease;
}
```

{{ demoenv() }}

<style>
.progress {
    height: 20px;
    margin-bottom: 20px;
    overflow: hidden;
    background-color: #f5f5f5;
    border-radius: 4px;
    box-shadow: inset 0 1px 2px rgba(0,0,0,.1);
}
.progress-bar {
    float: left;
    width: 0%;
    height: 100%;
    font-size: 12px;
    line-height: 20px;
    color: #fff;
    text-align: center;
    background-color: #337ab7;
    -webkit-box-shadow: inset 0 -1px 0 rgba(0,0,0,.15);
    box-shadow: inset 0 -1px 0 rgba(0,0,0,.15);
    -webkit-transition: width .6s ease;
    -o-transition: width .6s ease;
    transition: width .6s ease;
}
#restart-btn {
  opacity:0;
}
#restart-btn.show {
  opacity:1;
  transition: opacity 100ms ease-in;
}
</style>
<script>

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params){
      return startButton("Start Progress");
    });

    onPost("/start", function(request, params){
        var job = jobManager.start();
        return jobStatusTemplate(job);
    });

    onGet("/job", function(request, params){
        var job = jobManager.currentProcess();
        return jobStatusTemplate(job);
    });

    onGet("/job/progress", function(request, params, responseHeaders){
        var job = jobManager.currentProcess();

        if (job.complete) {
          responseHeaders["HX-Trigger"] = "done";
        }
        return jobProgressTemplate(job);
    });

    // templates
    function startButton(message) {
      return `<div hx-target="this" hx-swap="outerHTML">
  <h3>${message}</h3>
  <button class="btn" hx-post="/start">
            Start Job
  </button>
</div>`;
    }

    function jobProgressTemplate(job) {
      return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${job.percentComplete}" aria-labelledby="pblabel">
      <div id="pb" class="progress-bar" style="width:${job.percentComplete}%">
    </div>
  </div>`
    }

    function jobStatusTemplate(job) {
        return `<div hx-trigger="done" hx-get="/job" hx-swap="outerHTML" hx-target="this">
  <h3 role="status" id="pblabel" tabindex="-1" autofocus>${job.complete ? "Complete" : "Running"}</h3>

  <div
    hx-get="/job/progress"
    hx-trigger="${job.complete ? 'none' : 'every 600ms'}"
    hx-target="this"
    hx-swap="innerHTML">
    ${jobProgressTemplate(job)}
  </div>
  ${restartButton(job)}`;
    }

    function restartButton(job) {
      if(job.complete){
        return `
<button id="restart-btn" class="btn" hx-post="/start" classes="add show:600ms">
  Restart Job
</button>`
      } else {
        return "";
      }
    }

    var jobManager = (function(){
      var currentProcess = null;
      return {
        start : function() {
          currentProcess = {
            complete : false,
            percentComplete : 0
          }
          return currentProcess;
        },
        currentProcess : function() {
          currentProcess.percentComplete += Math.min(100, Math.floor(33 * Math.random()));  // simulate progress
          currentProcess.complete = currentProcess.percentComplete >= 100;
          return currentProcess;
        }
      }
    })();
</script>

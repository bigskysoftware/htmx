---
layout: demo_layout.njk
---
        
## Progress Bar

This example shows how to implement a smoothly scrolling progress bar.

We start with an intial state with a button that issues a `POST` to `/start` to begin the job:

```html
<div hx-target="this" hx-swap="outerHTML">
  <h3>Start Progress</h3>
  <button class="btn" hx-post="/start">
            Start Job
  </button>
</div>
```

This div is then replaced with a new div that reloads itself every 600ms:

```html
<div hx-target="this"
    hx-get="/job" 
    hx-trigger="load delay:600ms" 
    hx-swap="outerHTML">
  <h3>Running</h3>
  <div class="progress">
    <div id="pb" class="progress-bar" style="width:0%">
  </div>
</div>
```
This HTML is rerendered every 600 milliseconds, with the "width" style attribute on the progress bar being updated.
Because there is an id on the progress bar div, htmx will smoothly transition between requests by settling the
style attribute into its new value.  This, when coupled with CSS transitions, make the visual transition continuous
rather than jumpy.

Finally, when the process is complete, a restart button is added to the UI:

```html
<div hx-target="this"
    hx-get="/job" 
    hx-trigger="none" 
    hx-swap="outerHTML">
  <h3>Complete</h3>
  <div class="progress">
    <div id="pb" class="progress-bar" style="width:100%">
  </div>
</div>
<button id="restart-btn" class="btn" hx-post="/start" hx-classes="add show:600ms">
  Restart Job
</button> 
```

{% include demo_ui.html.liquid %}

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
    
    // templates
    function startButton(message) {
      return `<div hx-target="this" hx-swap="outerHTML">
  <h3>${message}</h3>
  <button class="btn" hx-post="/start">
            Start Job
  </button>
</div>`;
    }
    
    function jobStatusTemplate(job) {
        return `<div hx-target="this"
    hx-get="/job" 
    hx-trigger="${job.complete ? 'none' : 'load delay:600ms'}" 
    hx-swap="outerHTML">
  <h3>${job.complete ? "Complete" : "Running"}</h3>
  <div class="progress">
    <div id="pb" class="progress-bar" style="width:${job.percentComplete}%">
  </div>
</div>
${restartButton(job)}`;
    }

    function restartButton(job) {
      if(job.complete){
        return `<button id="restart-btn" class="btn" hx-post="/start" hx-classes="add show:600ms">
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

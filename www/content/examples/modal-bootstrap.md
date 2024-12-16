+++
title = "Modal Dialogs in Bootstrap"
template = "demo.html"
+++

Many CSS toolkits include styles (and Javascript) for creating modal dialog boxes.
This example shows how to use HTMX alongside original JavaScript provided by Bootstrap.

We start with a button that triggers the dialog, along with a DIV at the bottom of your
markup where the dialog will be loaded:

```html
<button
    hx-get="/modal"
    hx-target="#modals-here"
    hx-trigger="click"
    data-bs-toggle="modal"
    data-bs-target="#modals-here"
    class="btn primary">Open Modal</button>

<div id="modals-here"
    class="modal modal-blur fade"
    style="display: none"
    aria-hidden="false"
    tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content"></div>
    </div>
</div>
```

This button uses a `GET` request to `/modal` when this button is clicked.  The
contents of this file will be added to the DOM underneath the `#modals-here` DIV.

The server responds with a slightly modified version of Bootstrap's standard modal

```html
<div class="modal-dialog modal-dialog-centered">
  <div class="modal-content">
    <div class="modal-header">
      <h5 class="modal-title">Modal title</h5>
    </div>
    <div class="modal-body">
      <p>Modal body text goes here.</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    </div>
  </div>
</div>
```

<div id="modals-here"
class="modal modal-blur fade"
style="display: none"
aria-hidden="false"
tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-centered" role="document">
        <div class="modal-content"></div>
    </div>
</div>

{{ demoenv() }}

<style>
	@import "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.2.2/css/bootstrap.min.css";
</style>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-OERcA2EqjJCMA+/3y+gxIOqMEjwtxJY7qPCqsdltbNJuaOe923+mo//f6V8Qbsw3" crossorigin="anonymous"></script>
<script>

	//=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params) {
		return `<button
	hx-get="/modal"
	hx-target="#modals-here"
	hx-trigger="click"
    data-bs-toggle="modal"
    data-bs-target="#modals-here"
	class="btn primary">Open Modal</button>
	`})

	onGet("/modal", function(request, params){
	  return `<div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title">Modal title</h5>
        </div>
        <div class="modal-body">
            <p>Modal body text goes here.</p>
        </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    </div>
    </div>
</div>`
});
</script>

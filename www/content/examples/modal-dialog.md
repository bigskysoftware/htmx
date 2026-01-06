+++
title = "Modal Dialogs with HTML Dialogs"
template = "demo.html"
+++

Since 2022 the HTML spec has included a `<dialog>` tag and it works well with
htmx. Consider the following html:

```html
`<button
    class="btn primary" 
    hx-get="/modal"
    hx-target="#modal-placeholder"
    hx-swap="outerHTML"
    >Open Modal</button>

<div id="modal-placeholder"></div>
```

This button sends a `GET` request to `/modal` when the button is clicked.  The
server then responds with with a dialog that get swapped into an empty `<div>`.
The `<dialog>` looks like this:

```html
<dialog id="modal-dialog" closedby="none" hx-on::after-settle="this.showModal()">
    <h1>Modal Dialog</h1>
    This is the modal content. You can put anything here, like text, 
    or a form, or an image.
    <br/>
    <br/>
    <button class="btn danger" hx-get="/close" hx-target="#modal-dialog" hx-swap="outerHTML">Close</button>
</dialog>`
```

The close button fetches an empty `div` via the `/close` route to replace the dialog when it's closed:

```html
<div id="modal-holder"></div>
```

This essentially "resets" the page, and clicking the button again will open a new dialog.

Note that in the dialog:
1. We use `hx-on::after-settle`. This is needed because in order for the dialog to actually be shown,
the `showModal` function must be called.
2. The `closedby` attribute is set to `none`. If we didn't have this, the user might close the dialog,
via some mechanism that doesn't trigger the fetch of the `/close` endpoint.

{{ demoenv() }}

<div id="modal-placeholder"></div>

<style>
dialog {
    margin: auto;
    padding: 1em;
    border: 0;
}
</style>

<script>

	//=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params) {
		return `<button 
    class="btn primary" 
    hx-get="/modal"
    hx-target="#modal-placeholder"
    hx-swap="outerHTML"
    >Open Modal</button>
	`})

	onGet("/modal", function(request, params){
	  return `<dialog id="modal-dialog" closedby="none" hx-on::after-settle="this.showModal()">
    <h1>Modal Dialog</h1>
    This is the modal content. You can put anything here, like text, 
    or a form, or an image.
    <br/>
    <br/>
    <button class="btn danger" hx-get="/close" hx-target="#modal-dialog" hx-swap="outerHTML">Close</button>
</dialog>`
    })

	onGet("/close", function(request, params){
	  return `<div id="modal-placeholder"></div>`
    })
</script>

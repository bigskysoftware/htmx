+++
title = "Modal Dialogs with UIKit"
template = "demo.html"
+++

Many CSS toolkits include styles (and Javascript) for creating modal dialog boxes. 
This example shows how to use HTMX to display dynamic dialog using UIKit, and how to 
trigger its animation styles with little or no Javascript.

We start with a button that triggers the dialog, along with a DIV at the bottom of your 
markup where the dialog will be loaded:

This is an example of using HTMX to remotely load modal dialogs using UIKit.  In this example we will use
[Hyperscript](https://hyperscript.org) to demonstrate how cleanly that scripting language allows you to
glue htmx and other libraries together.

```html
<button 
	id="showButton"
	hx-get="/uikit-modal.html" 
	hx-target="#modals-here" 
	class="uk-button uk-button-primary" 
	_="on htmx:afterOnLoad wait 10ms then add .uk-open to #modal">Open Modal</button>

<div id="modals-here"></div>
```

This button uses a `GET` request to `/uikit-modal.html` when this button is clicked.  The
contents of this file will be added to the DOM underneath the `#modals-here` DIV.

Rather than using the standard UIKit Javascript library we are using a bit of Hyperscript, 
which triggers UIKit's smooth animations. It is delayed by 10ms so that UIKit's animations
will run correctly.

Finally, the server responds with a slightly modified version of UIKit's standard modal

```html
<div id="modal" class="uk-modal" style="display:block;">
	<div class="uk-modal-dialog uk-modal-body">
		<h2 class="uk-modal-title">Modal Dialog</h2>
		<p>This modal dialog was loaded dynamically by HTMX.</p>

		<form _="on submit take .uk-open from #modal">
			<div class="uk-margin">
				<input class="uk-input" placeholder="What is Your Name?">
			</div>
			<button type="button" class="uk-button uk-button-primary">Save Changes</button>
			<button 
				id="cancelButton"
				type="button" 
				class="uk-button uk-button-default" 
				_="on click take .uk-open from #modal wait 200ms then remove #modal">Close</button>
		</form>
	</div>
</div>
```

Hyperscript on the button and the form trigger animations when this dialog is completed
or canceled.  If you didn't use this Hyperscript, the modals will still work but UIKit's
fade in animations will not be triggered.

You can, of course, use JavaScript rather than Hyperscript for this work, it's just a lot more code:

```javascript

// This triggers the fade-in animation when a modal dialog is loaded and displayed
window.document.getElementById("showButton").addEventListener("htmx:afterOnLoad", function() {
	setTimeout(function(){
		window.document.getElementById("modal").classList.add("uk-open")
	}, 10)
})


// This triggers the fade-out animation when the modal is closed.
window.document.getElementById("cancelButton").addEventListener("click", function() {
	window.document.getElementById("modal").classList.remove("uk-open")
	setTimeout(function(){
		window.document.getElementById("modals-here").innerHTML = ""
		,200
	})
})
```

<div id="modals-here"></div>

{{ demoenv() }}

<style>
	@import "https://cdnjs.cloudflare.com/ajax/libs/uikit/3.5.9/css/uikit-core.min.css";
</style>

<script src="https://unpkg.com/hyperscript.org"></script>
<script>
    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params) {
		return `
<button 
	class="uk-button uk-button-primary" 
	hx-get="/modal" 
	hx-trigger="click" 
	hx-target="#modals-here"
	_="on htmx:afterOnLoad wait 10ms then add .uk-open to #modal">Show Modal Dialog</button>`
	})
		
	onGet("/modal", function(request, params){
	  return `
<div id="modal" class="uk-modal" style="display:block;">
	<div class="uk-modal-dialog uk-modal-body">
		<h2 class="uk-modal-title">Modal Dialog</h2>
		<p>This modal dialog was loaded dynamically by HTMX.  You can put any server request here and you don't (necessarily) need to use the UIKit Javascript file to make it work</p>

		<form _="on submit take .uk-open from #modal">
			<div class="uk-margin">
				<input class="uk-input" placeholder="What is Your Name?">
			</div>

			<div class="uk-margin">
				<input class="uk-input" placeholder="What is Your Quest?">
			</div>

			<div class="uk-margin">
				<input class="uk-input" placeholder="What is Your Favorite Color?">
			</div>

			<button type="button" class="uk-button uk-button-primary" _="on click call alert('submit to server and close dialog.')">Save Changes</button>
			<button type="button" class="uk-button uk-button-default" _="on click take .uk-open from #modal wait 200ms then remove #modal">Close</button>
		</form>
	</div>
</div>`
});
</script>

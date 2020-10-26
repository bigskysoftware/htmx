---
layout: demo_layout.njk
---
        
## Modal Dialogs

Many CSS toolkits include styles (and Javascript) for creating modal dialog boxes. 
This example shows how to use HTMX to display dynamic dialog using UIKit, and how to 
trigger its animation styles with little or no Javascript.

We start with a button that triggers the dialog, along with a DIV at the bottom of your 
markup where the dialog will be loaded:

This is an example of using HTMX to remotely load modal dialogs using UIKit.  

```html
<button 
	id="showButton"
	hx-get="/uikit-modal.html" 
	hx-target="#show-modals-here" 
	class="uk-button uk-button-primary" 
	_="on htmx:afterOnLoad wait 10ms then add .uk-open to #modal">Open Modal</button>

<div id="show-modals-here"></div>
```

This button uses a `GET` request to `/uikit-modal.html` when this button is clicked.  The
contents of this file will be added to the DOM underneath the `#show-modals-here` DIV.

We're replacing the standard UIKit Javascript library with a little bit of Hyperscript, 
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
or canceled.  If you don't want to use Hyperscript, the modals will still work but UIKit's
fade in animations will not be triggered.

Alternatively, you can add and remove these CSS classes without Hyperscript, by using in straight Javascript.  
It's just a lot more code:

```javascript

// This triggers the fade-in animation when a modal dialog is loaded and displayed
window.document.getElementById("showButton").addEventListener("htmx:afterOnLoad", function() {
	setTimeout(function(){
		window.document.getElementById("modal").classList.add("uk-open")
	}, 10)
})


// This triggers the fade-out animation when the modal is closed.
window.document.getElementById("cancelButton").addEventListener()
on click take .uk-open from #modal wait 200ms then remove #modal
```

The input issues a `POST` to `/search` on the `keyup` event and sets the body of the table to be the resulting content.

We add the `delay:500ms` modifier to the trigger to delay sending the query until the user stops typing.  Additionally, we add the `changed` modifier to the trigger to ensure we don't send new queries when the user doesn't change the value of the input (e.g. they hit an arrow key).  

Finally, we show an indicator when the search is in flight with the `hx-indicator` attribute. 

<div id="show-modals-here"></div>

{% include demo_ui.html.liquid %}

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
	hx-target="#show-modals-here"
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

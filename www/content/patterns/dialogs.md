+++
title = "Modals"
template = "demo.html"
+++

htmx provides several approaches for working with modals and dialogs, from simple browser-native dialogs to custom implementations and framework integrations.

**Jump to:**
1. [Browser Native Dialogs](#browser-native-dialogs)
2. [Custom Modal Dialogs](#custom-modal-dialogs)
3. [Bootstrap Modals](#bootstrap-modals)
4. [UIKit Modals](#uikit-modals)

## Browser Native Dialogs

The simplest approach uses the [`hx-confirm`](@/attributes/hx-confirm.md) attribute to trigger native browser dialogs. These are triggered by the user interaction that would trigger the AJAX request, but the request is only sent if the dialog is accepted.

```html
<div>
  <button class="btn primary"
          hx-post="/submit"
          hx-confirm="Are you sure?"
          hx-target="#response">
    Prompt Submission
  </button>
  <div id="response"></div>
</div>
```

## Custom Modal Dialogs

While htmx works great with dialogs built into CSS frameworks (like Bootstrap and UIKit below), htmx also makes it easy to build modal dialogs from scratch. Here is a quick example of one way to build them.

Click here to see a demo of the final result:

<button class="btn primary" hx-get="/modal" hx-target="body" hx-swap="beforeend">Open a Modal</button>

### High Level Plan

We're going to make a button that loads remote content from the server, then displays it in a modal dialog. The modal content will be added to the end of the `<body>` element, in a div named `#modal`.

In this demo we'll define some nice animations in CSS, and then use some [Hyperscript](https://hyperscript.org) to remove the modals from the DOM when the user is done. Hyperscript is *not* required with htmx, but the two were designed to be used together and it is much nicer for writing async & event oriented code than JavaScript, which is why we chose it for this example.

### Main Page HTML

```html
<button class="btn primary" hx-get="/modal" hx-target="body" hx-swap="beforeend">Open a Modal</button>
```

### Modal HTML Fragment
```html
<div id="modal" _="on closeModal add .closing then wait for animationend then remove me">
	<div class="modal-underlay" _="on click trigger closeModal"></div>
	<div class="modal-content">
		<h1>Modal Dialog</h1>
		This is the modal content.
		You can put anything here, like text, or a form, or an image.
		<br>
		<br>
		<button class="btn danger" _="on click trigger closeModal">Close</button>
	</div>
</div>
```

### Custom Stylesheet
```css
/***** MODAL DIALOG ****/
#modal {
	/* Underlay covers entire screen. */
	position: fixed;
	top:0px;
	bottom: 0px;
	left:0px;
	right:0px;
	background-color:rgba(0,0,0,0.5);
	z-index:1000;

	/* Flexbox centers the .modal-content vertically and horizontally */
	display:flex;
	flex-direction:column;
	align-items:center;

	/* Animate when opening */
	animation-name: fadeIn;
	animation-duration:150ms;
	animation-timing-function: ease;
}

#modal > .modal-underlay {
	/* underlay takes up the entire viewport. This is only
	required if you want to click to dismiss the popup */
	position: absolute;
	z-index: -1;
	top:0px;
	bottom:0px;
	left: 0px;
	right: 0px;
}

#modal > .modal-content {
	/* Position visible dialog near the top of the window */
	margin-top:10vh;

	/* Sizing for visible dialog */
	width:80%;
	max-width:600px;

	/* Display properties for visible dialog*/
	border:solid 1px #999;
	border-radius:8px;
	box-shadow: 0px 0px 20px 0px rgba(0,0,0,0.3);
	background-color:white;
	padding:20px;

	/* Animate when opening */
	animation-name:zoomIn;
	animation-duration:150ms;
	animation-timing-function: ease;
}

#modal.closing {
	/* Animate when closing */
	animation-name: fadeOut;
	animation-duration:150ms;
	animation-timing-function: ease;
}

#modal.closing > .modal-content {
	/* Animate when closing */
	animation-name: zoomOut;
	animation-duration:150ms;
	animation-timing-function: ease;
}

@keyframes fadeIn {
	0% {opacity: 0;}
	100% {opacity: 1;}
}

@keyframes fadeOut {
	0% {opacity: 1;}
	100% {opacity: 0;}
}

@keyframes zoomIn {
	0% {transform: scale(0.9);}
	100% {transform: scale(1);}
}

@keyframes zoomOut {
	0% {transform: scale(1);}
	100% {transform: scale(0.9);}
}
```

## Bootstrap Modals

Many CSS toolkits include styles (and Javascript) for creating modal dialog boxes.
This example shows how to use htmx alongside original JavaScript provided by Bootstrap.

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

This button uses a `GET` request to `/modal` when this button is clicked. The
contents of this file will be added to the DOM underneath the `#modals-here` DIV.

The server responds with a slightly modified version of Bootstrap's standard modal:

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

## UIKit Modals

This example shows how to use htmx to display dynamic dialogs using UIKit, and how to
trigger its animation styles with little or no Javascript.

This is an example of using htmx to remotely load modal dialogs using UIKit. In this example we will use
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

This button uses a `GET` request to `/uikit-modal.html` when this button is clicked. The
contents of this file will be added to the DOM underneath the `#modals-here` DIV.

Rather than using the standard UIKit Javascript library we are using a bit of Hyperscript,
which triggers UIKit's smooth animations. It is delayed by 10ms so that UIKit's animations
will run correctly.

Finally, the server responds with a slightly modified version of UIKit's standard modal:

```html
<div id="modal" class="uk-modal" style="display:block;">
	<div class="uk-modal-dialog uk-modal-body">
		<h2 class="uk-modal-title">Modal Dialog</h2>
		<p>This modal dialog was loaded dynamically by htmx.</p>

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
or canceled. If you didn't use this Hyperscript, the modals will still work but UIKit's
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
	}, 200)
})
```

<script type="text/javascript">

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/modal", function(request){
		return `
		<div id="modal" _="on closeModal add .closing wait for animationend then remove me">
			<div class="modal-underlay" _="on click trigger closeModal"></div>
			<div class="modal-content">
				<h1>Modal Dialog</h1>
				This is the modal content.
				You can put anything here, like text, or a form, or an image.
				<br>
				<br>
				<button class="btn danger" _="on click trigger closeModal">Close</button>
			</div>
		</div>
		`
      });
</script>

<style>
/***** MODAL DIALOG ****/

#modal {
	/* Underlay covers entire screen. */
	position: fixed;
	top:0px;
	bottom: 0px;
	left:0px;
	right:0px;
	background-color:rgba(0,0,0,0.5);
	z-index:1000;

	/* Flexbox centers the .modal-content vertically and horizontally */
	display:flex;
	flex-direction:column;
	align-items:center;

	/* Animate when opening */
	animation-name: fadeIn;
	animation-duration:150ms;
	animation-timing-function: ease;
}

#modal > .modal-underlay {
	/* underlay takes up the entire viewport. This is only
	required if you want to click to dismiss the popup */
	position: absolute;
	z-index: -1;
	top:0px;
	bottom:0px;
	left: 0px;
	right: 0px;
}

#modal > .modal-content {
	/* Position visible dialog near the top of the window */
	margin-top:10vh;

	/* Sizing for visible dialog */
	width:80%;
	max-width:600px;

	/* Display properties for visible dialog*/
	border:solid 1px #999;
	border-radius:8px;
	box-shadow: 0px 0px 20px 0px rgba(0,0,0,0.3);
	background-color:white;
	padding:20px;

	/* Animate when opening */
	animation-name:zoomIn;
	animation-duration:150ms;
	animation-timing-function: ease;
}

#modal.closing {
	/* Animate when closing */
	animation-name: fadeOut;
	animation-duration:150ms;
	animation-timing-function: ease;
}

#modal.closing > .modal-content {
	/* Animate when closing */
	animation-name: zoomOut;
	animation-duration:150ms;
	animation-timing-function: ease;
}

@keyframes fadeIn {
	0% {opacity: 0;}
	100% {opacity: 1;}
}

@keyframes fadeOut {
	0% {opacity: 1;}
	100% {opacity: 0;}
}

@keyframes zoomIn {
	0% {transform: scale(0.9);}
	100% {transform: scale(1);}
}

@keyframes zoomOut {
	0% {transform: scale(1);}
	100% {transform: scale(0.9);}
}
</style>

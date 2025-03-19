+++
title = "Custom Modal Dialogs"
template = "demo.html"
+++

While htmx works great with dialogs built into CSS frameworks (like [Bootstrap](@/examples/modal-bootstrap.md) and [UIKit](@/examples/modal-uikit.md)), htmx also makes
it easy to build modal dialogs from scratch.  Here is a quick example of one way to build them.

Click here to see a demo of the final result:

<button class="btn primary" hx-get="/modal" hx-target="body" hx-swap="beforeend">Open a Modal</button>

## High Level Plan

We're going to make a button that loads remote content from the server, then displays it in a modal dialog.  The modal
content will be added to the end of the `<body>` element, in a div named `#modal`.

In this demo we'll define some nice animations in CSS, and then use some [Hyperscript](https://hyperscript.org) to remove the
modals from the DOM when the user is done.  Hyperscript is *not* required with htmx, but the two were designed to be used
together and it is much nicer for writing async & event oriented code than JavaScript, which is why we chose it for this
example.

## Main Page HTML

```html
<button class="btn primary" hx-get="/modal" hx-target="body" hx-swap="beforeend">Open a Modal</button>
```

## Modal HTML Fragment
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

## Custom Stylesheet
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

<script src="https://cdn.jsdelivr.net/npm/htmx.org"></script>
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org"></script>
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

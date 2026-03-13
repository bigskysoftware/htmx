---
title: "Dialogs"
description: Show modals and popups on demand
icon: "icon-[vaadin--modal-list]"
---
htmx provides several approaches for working with modals and dialogs, from simple browser-native confirmation prompts to fully custom modal windows.

## Browser Native Dialogs

The simplest approach uses [`hx-confirm`](/reference/attributes/hx-confirm) to trigger a native browser dialog before sending a request:

```html
<button class="btn primary"
        hx-post="/submit"
        hx-confirm="Are you sure?"
        hx-target="#response">
  Prompt Submission
</button>
```

The AJAX request only fires if the user accepts the prompt. No extra HTML or CSS required.

## Custom Modal Dialogs

htmx makes it straightforward to build modals from scratch. A button loads remote content and appends it to `<body>` as a full-screen overlay:

```html
<button class="btn primary"
        hx-get="/modal"
        hx-target="body"
        hx-swap="beforeend">
  Open a Modal
</button>
```

The server returns the modal markup. [Hyperscript](https://hyperscript.org) handles the close animation -- adding a `.closing` class, waiting for the CSS animation to finish, then removing the element:

```html
<div id="modal" _="on closeModal add .closing wait for animationend then remove me">
  <div class="modal-underlay" _="on click trigger closeModal"></div>
  <div class="modal-content">
    <h1>Modal Dialog</h1>
    This is the modal content.
    You can put anything here, like text, or a form, or an image.
    <br><br>
    <button class="btn danger" _="on click trigger closeModal">Close</button>
  </div>
</div>
```

The CSS uses a fixed overlay with flexbox centering, plus keyframe animations for open/close transitions. Click the underlay or the Close button to dismiss.

## Framework Integration

CSS frameworks like Bootstrap and UIKit ship their own modal components. htmx works with these too -- use `hx-get` to load modal content into a framework-provided container, and trigger the framework's show/hide methods via JavaScript or Hyperscript. See the [Bootstrap](https://getbootstrap.com/docs/5.3/components/modal/) and [UIKit](https://getuikit.com/docs/modal) docs for their specific markup.

<script>
server.get("/demo", () => `
  <button class="btn primary" hx-get="/modal" hx-target="body" hx-swap="beforeend">
    Open a Modal
  </button>
`);

server.get("/modal", () => `
  <div id="modal" _="on closeModal add .closing wait for animationend then remove me">
    <div class="modal-underlay" _="on click trigger closeModal"></div>
    <div class="modal-content">
      <h1>Modal Dialog</h1>
      This is the modal content.
      You can put anything here, like text, or a form, or an image.
      <br><br>
      <button class="btn danger" _="on click trigger closeModal">Close</button>
    </div>
  </div>
`);

server.start("/demo");
</script>

<style>
#modal {
	position: fixed;
	top: 0; bottom: 0; left: 0; right: 0;
	background-color: rgba(0,0,0,0.5);
	z-index: 1000;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: fadeIn 150ms ease;
}

#modal > .modal-underlay {
	position: absolute;
	z-index: -1;
	top: 0; bottom: 0; left: 0; right: 0;
}

#modal > .modal-content {
	margin-top: 10vh;
	width: 80%;
	max-width: 600px;
	border: solid 1px #999;
	border-radius: 8px;
	box-shadow: 0 0 20px rgba(0,0,0,0.3);
	background-color: white;
	padding: 20px;
	animation: zoomIn 150ms ease;
}

#modal.closing { animation: fadeOut 150ms ease; }
#modal.closing > .modal-content { animation: zoomOut 150ms ease; }

@keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes zoomIn  { from { transform: scale(0.9); } to { transform: scale(1); } }
@keyframes zoomOut { from { transform: scale(1); } to { transform: scale(0.9); } }

/* Dark mode */
:is(.dark) #modal > .modal-content {
	background-color: #1f1f1f;
	color: #e5e5e5;
	border-color: #555;
}
</style>

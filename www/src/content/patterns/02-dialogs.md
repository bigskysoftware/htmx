---
includeMockServer: true
title: "Dialogs"
description: Show modals and popups on demand
category: "Display"
icon: "icon-[vaadin--modal-list]"
---

<script>
server.get("/demo", () => `
  <button class="px-3.5 py-1.5 text-sm font-medium rounded-md cursor-pointer text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 interact:bg-neutral-50 dark:interact:bg-neutral-850 interact:text-neutral-800 dark:interact:text-neutral-100 active:scale-[0.98] transition"
          hx-get="/modal-body"
          hx-target="#modal-body"
          command="show-modal"
          commandfor="modal">
    Open a Modal
  </button>

  <dialog id="modal" closedby="any"
          class="m-auto w-4/5 max-w-md p-6 rounded-lg bg-white dark:bg-neutral-900 shadow-xl text-left">
    <div id="modal-body" class="min-h-[92px] flex items-center text-sm text-neutral-500 dark:text-neutral-400">
      Loading&hellip;
    </div>
    <button class="mt-6 px-3.5 py-1.5 text-sm font-medium rounded-md cursor-pointer text-white dark:text-neutral-900 bg-neutral-800 dark:bg-neutral-200 interact:bg-neutral-700 dark:interact:bg-neutral-300 active:scale-[0.98] transition"
            command="close" commandfor="modal">
      Close
    </button>
  </dialog>
`);

server.get("/modal-body", () => ({ delay: 400, body: `
  <div>
    <h1 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Modal Dialog</h1>
    <p class="text-sm text-neutral-600 dark:text-neutral-400">
      This content came from the server. Press Escape, click the backdrop, or use the button to close.
    </p>
  </div>` }));

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex justify-center min-h-[116px]"></div>

## Basic usage

Use the native [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) element. The browser gives you the backdrop, the focus trap, Escape to close, and correct stacking. You write no JavaScript.

```html
<button command="show-modal" commandfor="modal">Open a Modal</button>

<dialog id="modal" closedby="any">
  <h1>Modal Dialog</h1>
  <p>This is the modal content.</p>
  <button command="close" commandfor="modal">Close</button>
</dialog>
```

- [`command`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#command)=`"show-modal"` opens the dialog as a modal. `command="close"` closes it.
- [`commandfor`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#commandfor) names the target dialog by `id`.
- [`closedby`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog#closedby)=`"any"` also closes the dialog on a backdrop click or on Escape.

A modal dialog renders in the [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer), above all page content. Its position in the DOM does not matter, so put it where it belongs in your markup.

## Loading content from the server

Add htmx attributes to the same button. It fetches the content and opens the dialog in one click.

```html
<button hx-get="/modal-body"
        hx-target="#modal-body"
        command="show-modal"
        commandfor="modal">
  Open a Modal
</button>

<dialog id="modal" closedby="any">
  <div id="modal-body">Loading...</div>
  <button command="close" commandfor="modal">Close</button>
</dialog>
```

- [`hx-get`](/reference/attributes/hx-get) requests the content.
- [`hx-target`](/reference/attributes/hx-target)=`"#modal-body"` puts the response inside the dialog.
- The dialog opens at once, so the user sees the loading state. The content replaces it when it arrives.

To load the whole dialog instead of its body, target the dialog itself with [`hx-swap`](/reference/attributes/hx-swap)=`"innerHTML"`. Keep the `<dialog>` element in the page so `commandfor` can always find it.

## Notes

### Browser support

`command` and `commandfor` are recent. If you must support an older browser, call [`showModal()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) instead:

```html
<button hx-get="/modal-body"
        hx-target="#modal-body"
        onclick="modal.showModal()">
  Open a Modal
</button>
```

`<dialog>` itself has been available in every major browser since 2022.

### Confirmations

For a yes or no question, you do not need a dialog at all. [`hx-confirm`](/reference/attributes/hx-confirm) shows the browser confirm and only sends the request when the user accepts.

```html
<button hx-delete="/contact/1" hx-confirm="Are you sure?">Delete</button>
```

To collect a value, use the [`hx-prompt`](/extensions/hx-prompt) extension. It shows a native prompt and sends the answer in the `HX-Prompt` request header.

### Centering with a CSS reset

The browser centers a modal dialog with `margin: auto`. A CSS reset that sets `margin: 0` on every element removes that, and the dialog stretches to the viewport edges. Tailwind's preflight does this. Put the margin back:

```css
dialog:modal {
  margin: auto;
}
```

### Styling the backdrop

Style the backdrop with the [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop) pseudo-element.

```css
dialog::backdrop {
  background: rgb(0 0 0 / 0.5);
}
```

<style>
#modal::backdrop { background: rgb(0 0 0 / 0.5) }
</style>

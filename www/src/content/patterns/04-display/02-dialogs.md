---
title: "Dialogs"
description: Show modals and popups on demand
icon: "icon-[vaadin--modal-list]"
soon: true
---

<script>
server.get("/demo", () => `
  <button class="px-3.5 py-1.5 text-sm font-medium rounded-md cursor-pointer text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 interact:bg-neutral-50 dark:interact:bg-neutral-850 interact:text-neutral-800 dark:interact:text-neutral-100 active:scale-[0.98] transition"
          hx-get="/modal"
          hx-target="body"
          hx-swap="beforeend">
    Open a Modal
  </button>
`);

server.get("/modal", () => `
  <div id="modal" class="fixed inset-0 bg-black/50 z-50 flex flex-col items-center" style="animation:fadeIn 150ms ease"
       _="on closeModal add .closing wait for animationend then remove me">
    <div class="absolute inset-0 z-[-1]" _="on click trigger closeModal"></div>
    <div class="mt-[10vh] w-4/5 max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-6" style="animation:zoomIn 150ms ease"
         _="on closeModal in closest #modal add .closing">
      <h1 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Modal Dialog</h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
        This is the modal content. You can put anything here, like text, or a form, or an image.
      </p>
      <button class="px-3.5 py-1.5 text-sm font-medium rounded-md cursor-pointer text-white dark:text-neutral-900 bg-neutral-800 dark:bg-neutral-200 interact:bg-neutral-700 dark:interact:bg-neutral-300 active:scale-[0.98] transition" _="on click trigger closeModal">Close</button>
    </div>
  </div>
`);

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex justify-center"></div>

## Browser native dialogs

The simplest approach uses [`hx-confirm`](/reference/attributes/hx-confirm) to trigger a native browser prompt before sending a request.

On the client, add `hx-confirm` to any element that makes a request:

```html
<button hx-post="/submit"
        hx-confirm="Are you sure?"
        hx-target="#response">
  Prompt Submission
</button>
```

- [`hx-confirm`](/reference/attributes/hx-confirm)=`"Are you sure?"` shows the browser's built-in confirm dialog.
- The AJAX request only fires if the user clicks OK. No extra HTML or CSS required.

## Custom modals

htmx makes it straightforward to build modals from scratch. A button loads remote content and appends it to `<body>` as a full-screen overlay.

On the client, a button fetches the modal markup:

```html
<button hx-get="/modal"
        hx-target="body"
        hx-swap="beforeend">
  Open a Modal
</button>
```

- [`hx-get`](/reference/attributes/hx-get) requests `/modal`.
- [`hx-target`](/reference/attributes/hx-target)=`"body"` targets the document body.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"beforeend"`](/reference/attributes/hx-swap#beforeend) appends the response as the last child of `<body>`.

On the server, respond with the full modal markup. [Hyperscript](https://hyperscript.org) handles the close animation -- adding a `.closing` class, waiting for the CSS transition to finish, then removing the element:

```html
<div id="modal"
     _="on closeModal add .closing
        wait for animationend
        then remove me">
  <div class="modal-underlay"
       _="on click trigger closeModal">
  </div>
  <div class="modal-content">
    <h1>Modal Dialog</h1>
    <p>This is the modal content.</p>
    <button _="on click trigger closeModal">
      Close
    </button>
  </div>
</div>
```

Click the underlay or the Close button to dismiss.

## Notes

CSS frameworks like Bootstrap and UIKit ship their own modal components. htmx works with these too -- use `hx-get` to load modal content into a framework-provided container, and trigger the framework's show/hide methods via JavaScript or Hyperscript.

<style>
@keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
@keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
@keyframes zoomIn  { from { transform: scale(0.9) } to { transform: scale(1) } }
@keyframes zoomOut { from { transform: scale(1) } to { transform: scale(0.9) } }
#modal.closing { animation: fadeOut 150ms ease forwards }
#modal.closing > div:last-child { animation: zoomOut 150ms ease forwards }
</style>

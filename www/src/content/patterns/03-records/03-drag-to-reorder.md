---
title: "Drag to Reorder"
description: Change order of records with drag and drop
icon: "icon-[solar--reorder-linear]"
soon: true
---

<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<script>
document.addEventListener("htmx:load", (e) => {
    const sortables = e.detail.elt.querySelectorAll(".sortable");
    for (const sortable of sortables) {
      const sortableInstance = new Sortable(sortable, {
          animation: 150,
          ghostClass: "sortable-ghost",

          filter: ".htmx-indicator",
          onMove: (evt) => evt.related.className.indexOf("htmx-indicator") === -1,

          onEnd: function (evt) {
            this.option("disabled", true);
          }
      });

      sortable.addEventListener("htmx:afterSwap", () => {
        sortableInstance.option("disabled", false);
      });
    }
});

// Inject ghost class styles (Sortable applies this class name directly)
const style = document.createElement("style");
style.textContent = `.sortable-ghost { opacity: 0.5 !important; }`;
document.head.appendChild(style);

let listItems = [1, 2, 3, 4, 5];

server.get("/demo", () => `
<form class="sortable" hx-post="/items" hx-trigger="end">
  ${listContents()}
</form>`);

server.post("/items", (req) => {
    listItems = req.params.item;
    return listContents();
});

const listContents = () => {
    return `<div class="cursor-default bg-transparent border-none px-0 py-1 my-0 w-auto text-xs text-neutral-600 dark:text-neutral-400 italic htmx-indicator">Updating...</div>\n` +
        listItems.map((val) =>
            `<div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 my-2 w-52 cursor-grab active:cursor-grabbing rounded-md select-none text-sm text-neutral-700 dark:text-neutral-200 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-850"><input type="hidden" name="item" value="${val}"/>Item ${val}</div>`
        ).join("\n");
};

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex justify-center"></div>

## Basic usage

This pattern integrates the [Sortable.js](https://sortablejs.github.io/Sortable/) library with htmx to persist drag-and-drop reordering on the server.

On the client, wrap your items in a form that posts on the Sortable `end` event.

```html
<form class="sortable" hx-post="/items" hx-trigger="end">
  <div class="htmx-indicator">Updating...</div>
  <div><input type="hidden" name="item" value="1"/>Item 1</div>
  <div><input type="hidden" name="item" value="2"/>Item 2</div>
  <div><input type="hidden" name="item" value="3"/>Item 3</div>
</form>
```

- [`hx-post`](/reference/attributes/hx-post) sends the new order to `/items`.
- [`hx-trigger`](/reference/attributes/hx-trigger)=`"end"` fires when Sortable.js finishes a drag (the `end` event bubbles up to the form).
- Each item has a hidden input so the server receives the ids in their new order.

On the server, read the `item` parameter (which arrives as an ordered list) and respond with the updated list HTML.

## Notes

### Sortable.js initialization

Initialize Sortable on your containers using the `htmx:load` event so it works after htmx swaps in new content.

```js
document.addEventListener("htmx:load", (e) => {
    const sortables = e.detail.elt.querySelectorAll(".sortable");
    for (const sortable of sortables) {
      const sortableInstance = new Sortable(sortable, {
          animation: 150,
          ghostClass: "sortable-ghost",

          // Make the `.htmx-indicator` unsortable
          filter: ".htmx-indicator",
          onMove: (evt) =>
            evt.related.className.indexOf("htmx-indicator") === -1,

          // Disable sorting until the server responds
          onEnd: function (evt) {
            this.option("disabled", true);
          }
      });

      // Re-enable sorting after the swap completes
      sortable.addEventListener("htmx:afterSwap", () => {
        sortableInstance.option("disabled", false);
      });
    }
});
```

Note that `onEnd` uses a regular `function` (not an arrow function) because it needs `this` to refer to the Sortable instance. Sorting is disabled during the request and re-enabled on `htmx:afterSwap` to prevent the user from reordering while the server is processing.

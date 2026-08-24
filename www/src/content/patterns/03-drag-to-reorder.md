---
includeMockServer: true
title: "Drag to Reorder"
description: Change order of records with drag and drop
category: "Records"
icon: "icon-[mdi--reorder-horizontal]"
---

<script>
var _listItems = [1, 2, 3, 4, 5];

function listContents() {
    return `<div class="cursor-default bg-transparent border-none px-0 py-1 my-0 w-auto text-xs text-neutral-600 dark:text-neutral-400 italic htmx-indicator">Updating...</div>\n` +
        _listItems.map((val) =>
            `<div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 my-2 w-52 cursor-grab active:cursor-grabbing rounded-md select-none text-sm text-neutral-700 dark:text-neutral-200 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-850"><input type="hidden" name="item" value="${val}"/>Item ${val}</div>`
        ).join("\n");
}

server.get("/demo", () => `
<form class="sortable" hx-post="/items" hx-trigger="end"
      hx-on:load="new Sortable(this, {
                      animation: 150,
                      ghostClass: 'sortable-ghost',
                      filter: '.htmx-indicator',
                      onMove: e => !e.related.classList.contains('htmx-indicator'),
                      onEnd: function () { this.option('disabled', true) }
                  })"
      hx-on::after:swap="Sortable.get(this).option('disabled', false)">
  ${listContents()}
</form>`);

server.post("/items", (req) => {
    _listItems = [].concat(req.params.item);
    // a real save takes a moment, so the htmx-indicator is visible
    return { delay: 400, body: listContents() };
});

// Start the demo only once Sortable is on the page, so hx-on:load can use it.
import("https://cdn.jsdelivr.net/npm/sortablejs@1.15.7/modular/sortable.esm.js")
    .then(m => { window.Sortable = m.default; server.start("/demo"); });
</script>

<style>
.sortable-ghost { opacity: 0.5 }
</style>

<div id="demo-content" class="not-prose demo-container flex justify-center min-h-[364px]"></div>

## Basic usage

This pattern integrates the [Sortable.js](https://sortablejs.github.io/Sortable/) library with htmx to persist drag-and-drop reordering on the server.

On the client, wrap your items in a form that posts on the Sortable `end` event.

```html
<form class="sortable" hx-post="/items" hx-trigger="end"
      hx-on:load="new Sortable(this, {
                      animation: 150,
                      ghostClass: 'sortable-ghost',
                      filter: '.htmx-indicator',
                      onMove: e => !e.related.classList.contains('htmx-indicator'),
                      onEnd: function () { this.option('disabled', true) }
                  })"
      hx-on::after:swap="Sortable.get(this).option('disabled', false)">
  <div class="htmx-indicator">Updating...</div>
  <div><input type="hidden" name="item" value="1"/>Item 1</div>
  <div><input type="hidden" name="item" value="2"/>Item 2</div>
  <div><input type="hidden" name="item" value="3"/>Item 3</div>
</form>
```

- [`hx-post`](/reference/attributes/hx-post) sends the new order to `/items`.
- [`hx-trigger`](/reference/attributes/hx-trigger)=`"end"` fires when Sortable finishes a drag. Note that the `end` event bubbles up to the form.
- Each item has a hidden input, so the server receives the ids in their new order.
- The `.htmx-indicator` div shows while the request is in flight. htmx hides it again when the response completes.
- [`hx-on:load`](/reference/attributes/hx-on) builds the Sortable instance when htmx processes the form.  Note that this is just for convenience, you could easily move this to a vanilla setup script.

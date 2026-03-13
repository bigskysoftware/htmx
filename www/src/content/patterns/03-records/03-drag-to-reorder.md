---
title: "Drag to Reorder"
description: Change order of records with drag and drop
icon: "icon-[solar--reorder-linear]"
---
In this example we show how to integrate the [Sortable](https://sortablejs.github.io/Sortable/)
JavaScript library with htmx.

To begin we initialize the `.sortable` class with the `Sortable` JavaScript library:

```js
document.addEventListener('htmx:load', (e) => {
    const sortables = e.detail.elt.querySelectorAll(".sortable");
    for (const sortable of sortables) {
      const sortableInstance = new Sortable(sortable, {
          animation: 150,
          ghostClass: 'sortable-ghost',

          // Make the `.htmx-indicator` unsortable
          filter: ".htmx-indicator",
          onMove: (evt) => evt.related.className.indexOf('htmx-indicator') === -1,

          // Disable sorting on the `end` event
          onEnd: function (evt) {
            this.option("disabled", true);
          }
      });

      // Re-enable sorting on the `htmx:afterSwap` event
      sortable.addEventListener("htmx:afterSwap", () => {
        sortableInstance.option("disabled", false);
      });
    }
});
```

Note that the `onEnd` callback uses a regular `function` rather than an arrow function because it
needs `this` to refer to the Sortable instance.

Next, we create a form that has some sortable divs within it and trigger an ajax request on the
`end` event fired by Sortable.js:

```html
<form class="sortable" hx-post="/items" hx-trigger="end">
  <div class="htmx-indicator">Updating...</div>
  <div><input type='hidden' name='item' value='1'/>Item 1</div>
  <div><input type='hidden' name='item' value='2'/>Item 2</div>
  <div><input type='hidden' name='item' value='3'/>Item 3</div>
  <div><input type='hidden' name='item' value='4'/>Item 4</div>
  <div><input type='hidden' name='item' value='5'/>Item 5</div>
</form>
```

Each div has a hidden input that specifies the item id for that row. When the list is reordered
via drag-and-drop, the `end` event fires and htmx posts the item ids in the new order to `/items`,
to be persisted by the server.

That's it!

<style>
#demo-content .sortable > div {
  background: white;
  border: 1px solid #e5e5e5;
  padding: 12px;
  margin: 8px 0;
  width: 200px;
  cursor: grab;
  border-radius: 6px;
  user-select: none;
}
:is(.dark) #demo-content .sortable > div {
  background: #1a1a1a;
  border-color: #404040;
  color: #e5e5e5;
}
#demo-content .sortable > div:active {
  cursor: grabbing;
}
#demo-content .sortable .htmx-indicator {
  cursor: default;
  background: transparent;
  border: none;
  padding: 4px 0;
  margin: 0;
}
#demo-content .sortable-ghost {
  background: #c8e1ff !important;
  opacity: 0.8;
}
:is(.dark) #demo-content .sortable-ghost {
  background: #1e3a5f !important;
}
</style>

<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<script>
    // Initialize Sortable on demo content when htmx processes it.
    // Uses htmx:load event (bubbles to document) instead of htmx.onLoad()
    // because htmx loads with defer and may not be available yet.
    document.addEventListener('htmx:load', (e) => {
        const sortables = e.detail.elt.querySelectorAll(".sortable");
        for (const sortable of sortables) {
          const sortableInstance = new Sortable(sortable, {
              animation: 150,
              ghostClass: 'sortable-ghost',

              filter: ".htmx-indicator",
              onMove: (evt) => evt.related.className.indexOf('htmx-indicator') === -1,

              onEnd: function (evt) {
                this.option("disabled", true);
              }
          });

          sortable.addEventListener("htmx:afterSwap", () => {
            sortableInstance.option("disabled", false);
          });
        }
    });

    let listItems = [1, 2, 3, 4, 5];

    server.get("/demo", (req) => {
      return `<form id="example1" class="list-group col sortable" hx-post="/items" hx-trigger="end">${listContents()}\n</form>`;
    });

    server.post("/items", (req) => {
      listItems = req.params.item;
      return listContents();
    });

    const listContents = () => {
      return `<div class="htmx-indicator">Updating...</div>\n` + listItems.map((val) => {
        return `  <div><input type="hidden" name="item" value="${val}"/> Item ${val}</div>`;
      }).join("\n");
    };

    server.start("/demo");
</script>

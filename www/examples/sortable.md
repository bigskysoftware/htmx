---
layout: demo_layout.njk
---
        
## Sortable

In this example we show how to integrate the [Sortable](https://sortablejs.github.io/sortablejs/)
javascript library with htmx.

To begin we intialize the `.sortable` class with the `Sortable` javascript library:

```js
htmx.onLoad(function(content) {
    var sortables = content.querySelectorAll(".sortable");
    for (var i = 0; i < sortables.length; i++) {
      var sortable = sortables[i];
      new Sortable(sortable, {
          animation: 150,
          ghostClass: 'blue-background-class'
      });
    }
})
```

Next, we create a form that has some sortable divs within it, and we trigger an ajax request on the `end` event, fired
by Sortable.js:

```html
<form class="sortable" hx-post="/items" hx-trigger="end">
  <div><input type='hidden' name='item' value='1'/>Item 1</div>
  <div><input type='hidden' name='item' value='2'/>Item 1</div>
  <div><input type='hidden' name='item' value='3'/>Item 1</div>
  <div><input type='hidden' name='item' value='4'/>Item 1</div>
  <div><input type='hidden' name='item' value='5'/>Item 1</div>
</form>
```

Note that each div has a hidden input inside of it that specifies the item id for that row.

When the list is reordered via the Sortable.js drag-and-drop, the `end` event will be fired.  htmx will then post
the item ids in the new order to `/items`, to be persisted by the server.

That's it!

{% include demo_ui.html.liquid %}
<script src="https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js"></script>
<script>

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================
    htmx.onLoad(function(content) {
        var sortables = content.querySelectorAll(".sortable");
        for (var i = 0; i < sortables.length; i++) {
          var sortable = sortables[i];
          new Sortable(sortable, {
              animation: 150,
              ghostClass: 'blue-background-class'
          });
        }
    })
    
    var listItems = [1, 2, 3, 4, 5]
    // routes
    init("/demo", function(request, params){
      return '<form id=example1" class="list-group col sortable" hx-post="/items" hx-trigger="end">\n' +
      listContents()
      + "\n</form>";
    });
    
    onPost("/items", function (request, params) {
      console.log(params);
      listItems = params.item;
      return listContents();
    });
    
    // templates
    function listContents() {
      return listItems.map(function(val) {
        return "  <div><input type='hidden' name='item' value='" + val + "'/> Item " + val +"</div>";
      }).join("\n");
    }

</script>

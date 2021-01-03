---
layout: demo_layout.njk
---
        
## Sortable

In this example we show how to integrate the [Sortable](https://sortablejs.github.io/sortablejs/)
javascript library with htmx.

To begin we load the Sortable for content with the `.sortable` class:

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

And we return the following HTML from the server:

```html
<div id="example1" class="list-group col" hx-post="/items" hx-trigger="end">
  <div class="list-group-item">Item 1</div>
  <div class="list-group-item">Item 2</div>
  <div class="list-group-item">Item 3</div>
  <div class="list-group-item">Item 4</div>
  <div class="list-group-item">Item 5</div>
</div>
```

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

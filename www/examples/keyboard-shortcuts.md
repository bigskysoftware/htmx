---
layout: demo_layout.njk
---
        
## Keyboard Shortcut

In this example we show how to create a keyboard shortcut for an action.

We start with a simple button that loads some content from the server:

```html
<button hx-trigger="click, keyup[altKey&&shiftKey&&key=='D']"
        hx-post="/doit">Do It! (alt-shift-D)</button>
```

Note that the button responds to both the `click` event (as usual) and then the keyup event when `alt-shift-D` is pressed, coming from the body (making it a global shortcut).

You can trigger the demo below by either clicking on the button, or by hitting alt-shift-D.

You can find out the conditions needed for a given keyboard shortcut here:

https://javascript.info/keyboard-events

{% include demo_ui.html.liquid %}

<script>

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/init", function(request, params){
        return "<button style='font-size:20pt' hx-trigger='click, keyup[altKey&&shiftKey&&key==\"D\"] from:body'" +
                      " hx-post='/doit'>Do It! (alt-shift-D) </button>";
    });
    
    onPost("/doit", function (request, params) {
        return "Did it!";
    });

</script>

---
layout: demo_layout.njk
---
        
## A Customized Confirmation UI

htmx supports the [`hx-confirm`](/attributes/hx-confirm) attribute to provide a simple mechanism for confirming a user action.  This uses the default `confirm()` function in javascript which, while trusty, may not be consistent with your applications UX.

In this example we will see how to use [sweetalert2](https://sweetalert2.github.io) to implement a custom confirmation dialog.

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<button hx-trigger='confirmed'
        hx-get="/confirmed"
        _="on click
             call Swal.fire({title: 'Confirm', text:'Do you want to continue?'})
             if result.isConfirmed trigger confirmed">
  Click Me
</button>
```

The technique here is to make the button issue a request on the `confirmed` event, rather than a click.

We then add some hyperscript to invoke Sweet Alert 2 on a click, asking for confirmation.  If the user confirms
the dialog, we trigger the `confirmed` event, which then triggers the htmx request.

Note that we are taking advantage of the fact that hyperscript is [async-transparent](https://hyperscript.org/docs/#async)
and automatically resolves the Promise returned by `Swal.fire()`.

A VanillaJS implementation is left as an exercise for the reader.  :)

{% include demo_ui.html.liquid %}

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>

<script>

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params){
      return initialUI();
    });
    
    onGet("/confirmed", function (request, params) {
        return "Confirmed"
    });
    
    // templates
    function initialUI() {
      return `<button hx-trigger='confirmed'
                      hx-get="/confirmed"
                      _="on click
                           call Swal.fire({title: 'Confirm', text:'Do you want to continue?'})
                           if result.isConfirmed trigger confirmed">
                Click Me
              </button>`;
    }

</script>

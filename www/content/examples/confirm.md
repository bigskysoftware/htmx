+++
title = "A Customized Confirmation UI"
template = "demo.html"
+++

htmx supports the [`hx-confirm`](@/attributes/hx-confirm.md) attribute to provide a simple mechanism for confirming a user
action.  This uses the default `confirm()` function in javascript which, while trusty, may not be consistent with your 
applications UX.

In this example we will see how to use [sweetalert2](https://sweetalert2.github.io) and the [`htmx:confirm`](@/events.md#htmx:confirm)
event to implement a custom confirmation dialog.

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<button hx-get="/confirmed"
        _="on htmx:confirm(issueRequest)
             halt the event
             call Swal.fire({title: 'Confirm', text:'Do you want to continue?'})
             if result.isConfirmed issueRequest()">
  Click Me
</button>
```

We add some hyperscript to invoke Sweet Alert 2 on a click, asking for confirmation.  If the user confirms
the dialog, we trigger the request by invoking the `issueRequest()` function, which was destructured from the event
detail object.

Note that we are taking advantage of the fact that hyperscript is [async-transparent](https://hyperscript.org/docs/#async)
and automatically resolves the Promise returned by `Swal.fire()`.

A VanillaJS implementation is left as an exercise for the reader.  :)

{{ demoenv() }}

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

+++
title = "A Customized Confirmation UI"
template = "demo.html"
+++

htmx supports the [`hx-confirm`](@/attributes/hx-confirm.md) attribute to provide a simple mechanism for confirming a user
action.  This uses the default `confirm()` function in javascript which, while trusty, may not be consistent with your 
applications UX.

In this example we will see how to use [sweetalert2](https://sweetalert2.github.io) and the [`htmx:confirm`](@/events.md#htmx:confirm)
event to implement a custom confirmation dialog. Below are two examples, one with `hyperscript` using a click+custom event method, and one in vanilla JS and the built-in `hx-confirm` attribute.

## Hyperscript, on click+custom event

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<button hx-get="/confirmed" 
        hx-trigger='confirmed'
        _="on click
            call Swal.fire({title: 'Confirm', text:'Do you want to continue?'})
            if result.isConfirmed trigger confirmed">
  Click Me
</button>
```

We add some hyperscript to invoke Sweet Alert 2 on a click, asking for confirmation.  If the user confirms
the dialog, we trigger the request by triggering the custom "confirmed" event
which is then picked up by `hx-trigger`.

Note that we are taking advantage of the fact that hyperscript is [async-transparent](https://hyperscript.org/docs/#async)
and automatically resolves the Promise returned by `Swal.fire()`.

A VanillaJS implementation is left as an exercise for the reader.  :)

## Vanilla JS, hx-confirm

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
  document.addEventListener("htmx:confirm", function(e) {
    e.preventDefault()
    Swal.fire({
      title: "Proceed?",
      text: `I ask you... ${e.detail.question}`
    }).then(function(result) {
      if(result.isConfirmed) e.detail.issueRequest(true) // use true to skip window.confirm
    })
  })
</script>
  
<button hx-get="/confirmed" hx-confirm="Some confirm text here">
  Click Me
</button>
```

We add some javascript to invoke Sweet Alert 2 on a click, asking for confirmation.  If the user confirms
the dialog, we trigger the request by calling the `issueRequest` method. We pass `skipConfirmation=true` as argument to skip `window.confirm`.

This allows to use `hx-confirm`'s value in the prompt which is convenient
when the question depends on the element e.g. a django list:

```html
{% for client in clients %}
<button hx-post="/delete/{{client.pk}}" hx-confirm="Delete {{client.name}}??">Delete</button>
{% endfor %}
```

{{ demoenv() }}

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
  document.addEventListener("htmx:confirm", function(e) {
    e.preventDefault()
    Swal.fire({
      title: "Proceed?",
      text: `I ask you... ${e.detail.question}`,
      showCancelButton: true
    }).then(function(result) {
      if(result.isConfirmed) e.detail.issueRequest(true)
    })
  })
</script>
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
      return `<button hx-get="/confirmed"
        _="on htmx:confirm(issueRequest)
             halt the event
             call Swal.fire({title: 'Confirm', text:'Do you want to continue?'})
             if result.isConfirmed issueRequest()">
  Click me (hyperscript click & custom event)
</button><br><br>
    <button id="confirmButton" hx-get="/confirmed"  hx-confirm="Some confirm text here">
  Click Me (vanilla JS, hx-confirm)
</button>
`;
    }

</script>

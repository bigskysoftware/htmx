+++
title = "A Customized Confirmation UI"
template = "demo.html"
+++

htmx supports the [`hx-confirm`](@/attributes/hx-confirm.md) attribute to provide a simple mechanism for confirming a user
action.  This uses the default `confirm()` function in javascript which, while trusty, may not be consistent with your 
applications UX.

In this example we will see how to use [sweetalert2](https://sweetalert2.github.io)  to implement a custom confirmation dialog. Below are two 
examples, one using a click+custom event method, and one using the built-in `hx-confirm` attribute and
the [`htmx:confirm`](@/events.md#htmx:confirm) event.

## Using on click+custom event

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<button hx-get="/confirmed" 
        hx-trigger='confirmed'
        onClick="Swal.fire({title: 'Confirm', text:'Do you want to continue?'}).then((result)=>{
            if(result.isConfirmed){
              htmx.trigger(this, 'confirmed');  
            } 
        })">
  Click Me
</button>
```

Here we use javascript to show a Sweet Alert 2 on a click, asking for confirmation.  If the user confirms
the dialog, we then trigger the request by triggering the custom "confirmed" event
which is then picked up by `hx-trigger`.

## Vanilla JS, hx-confirm

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
  document.addEventListener("htmx:confirm", function(e) {
    // The event is triggered on every trigger for a request, so we need to check if the element
    // that triggered the request has a confirm question set via the hx-confirm attribute,
    // if not we can return early and let the default behavior happen
    if (!e.detail.question) return

    // This will prevent the request from being issued to later manually issue it
    e.preventDefault()

    Swal.fire({
      title: "Proceed?",
      text: `I ask you... ${e.detail.question}`
    }).then(function(result) {
      if (result.isConfirmed) {
        // If the user confirms, we manually issue the request
        e.detail.issueRequest(true); // true to skip the built-in window.confirm()
      }
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

Learn more about the [`htmx:confirm`](@/events.md#htmx:confirm) event [here](@/events.md#htmx:confirm).

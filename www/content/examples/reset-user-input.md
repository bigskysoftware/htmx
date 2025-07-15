+++
title = "Reset user input"
template = "demo.html"
+++

This example shows how to easily reset user inputs using [`hx-on`](@/attributes/hx-on.md),
allowing users to make multiple requests without having to manually delete their previous inputs.

The inline script will run on the [`afterRequest`](@/events.md#htmx:afterRequest) event and ensures 
that the form will reset to its initial state as long as the response has a 20x status code:

```html
<form hx-post="/note"
      hx-target="#notes" 
      hx-swap="afterbegin"
      hx-on::after-request="if(event.detail.successful) this.reset()">
    <div class="form-group">
        <label>Add a note</label>
        <input type="text" name="note-text" placeholder="blank canvas">
    </div>
    <button class="btn">Add</button>
</form>
<ul id="notes"><!-- Response will go here --></ul>
```

The `reset()` method is only available on `form` elements. 
For other elements, the input value can explicitly selected and reset to a default to achieve the same result.
The following code is functionally equivalent:

```html
<div>
    <label>Add a note</label>
    <input id="note-input" type="text" name="note-text" placeholder="blank canvas">
</div>
<button class="btn primary" 
        hx-post="/note" 
        hx-target="#note" 
        hx-swap="afterbegin" 
        hx-include="#note-input"
        hx-on::after-request="if(event.detail.successful)
            document.getElementById('note-input').value = ''">
    Add
</button>
<ul id="notes"><!-- Response will go here --></ul>
```

{{ demoenv() }}

<script>

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request) {
        return formTemplate();
    })

    onPost("/note", function(request, params) {
        var note = params['note-text'];
        if (note) {
            return `<li>${note}</li>`;
        }
    })

    // templates
    function formTemplate() {
        return `
<form hx-post="/note" hx-target="#notes" hx-swap="afterbegin" hx-on::after-request="if(event.detail.successful) this.reset()">
    <div class="form-group">
        <label>Add a note</label>
        <input type="text" name="note-text" placeholder="blank canvas">
    </div>
    <button class="btn primary">Add</button>
</form>
<ul id="notes"> </ul>`;
    }
</script>


+++
title = "Dialogs"
template = "demo.html"
+++

Dialogs can be triggered with the [`hx-prompt`](@/attributes/hx-prompt.md) and [`hx-confirm`](@/attributes/hx-confirm.md)attributes.  These are triggered by the user interaction that would trigger the AJAX request, but the request is only sent if the dialog is accepted.

```html
<div>
  <button class="btn primary"
          hx-post="/submit"
          hx-prompt="Enter a string"
          hx-confirm="Are you sure?"
          hx-target="#response">
    Prompt Submission
  </button>
  <div id="response"></div>
</div>
```

The value provided by the user to the prompt dialog is sent to the server in a `HX-Prompt` header.  In this case, the server simply echos the user input back.

```html
User entered <i>${response}</i>
```

{{ demoenv() }}

<script>

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params){
      return submitButton();
    });

    onPost("/submit", function(request, params){
        var response = request.requestHeaders['HX-Prompt'];
        return promptSubmit(response);
    });

    // templates
    function submitButton() {
      return `<div>
  <button class="btn primary"
          hx-post="/submit"
          hx-prompt="Enter a string"
          hx-confirm="Are you sure?"
          hx-target="#response">
    Prompt Submission
  </button>
  <div id="response"></div>
</div>`;
    }

    function promptSubmit(response) {
        return `User entered <i>${response}</i>`;
    }
</script>

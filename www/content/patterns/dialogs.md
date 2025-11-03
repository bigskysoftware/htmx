+++
title = "Dialogs"
template = "demo.html"
+++

Dialogs can be triggered with the [`hx-confirm`](@/attributes/hx-confirm.md)attributes.  These are triggered by the user interaction that would trigger the AJAX request, but the request is only sent if the dialog is accepted.

```html
<div>
  <button class="btn primary"
          hx-post="/submit"
          hx-confirm="Are you sure?"
          hx-target="#response">
    Prompt Submission
  </button>
  <div id="response"></div>
</div>
```

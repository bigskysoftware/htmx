+++
title = "hx-confirm"
description = """\
  The hx-confirm attribute in htmx provides a way to add confirmation dialogs before executing requests, allowing \
  you to protect users from accidental destructive actions. This documentation explains how to implement confirmation \
  prompts and customize their behavior through event handling."""
+++

The `hx-confirm` attribute allows you to confirm an action before issuing a request.  This can be useful
in cases where the action is destructive and you want to ensure that the user really wants to do it.

Here is an example:

```html
<button hx-delete="/account" hx-confirm="Are you sure you wish to delete your account?">
  Delete My Account
</button>
```

## Event details

The event triggered by `hx-confirm` contains additional properties in its `detail`:

* triggeringEvent: the event that triggered the original request
* issueRequest(skipConfirmation=false): a callback which can be used to confirm the AJAX request
* question: the value of the `hx-confirm` attribute on the HTML element

## Notes

* `hx-confirm` is inherited and can be placed on a parent element
* `hx-confirm` uses the browser's `window.confirm` by default. You can customize this behavior as shown [in this example](@/examples/confirm.md).
* a boolean `skipConfirmation` can be passed to the `issueRequest` callback; if true (defaults to false), the `window.confirm` will not be called and the AJAX request is issued directly

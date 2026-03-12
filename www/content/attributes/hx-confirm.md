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

## JavaScript Confirmation

Using the `js:` prefix you can write custom confirmation logic for a trigger.

The expression is evaluated as async JavaScript (it will be awaited if it returns a promise).

If returns or resolves to a truthy value then the request proceeds otherwise it is canceled.

```html
<button hx-delete="/account" hx-confirm="js: await sweetConfirm('Delete your account?')">
  Delete My Account
</button>
```

## Event details

The event triggered by `hx-confirm` contains additional properties in its `detail`:

* triggeringEvent: the event that triggered the original request
* issueRequest(): a callback to confirm and issue the AJAX request
* dropRequest(): a callback to cancel the request
* question: the value of the `hx-confirm` attribute on the HTML element

## Notes

* `hx-confirm` uses the browser's `window.confirm` by default. You can customize this behavior as shown [in this example](@/patterns/confirm.md).
* If you call `preventDefault()` on the `htmx:confirm` event, you **must** call either `issueRequest()` or `dropRequest()` — failing to do so will leave the request pending indefinitely.

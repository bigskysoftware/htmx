---
title: "hx-confirm"
description: "Shows a confirmation dialog before the request"
---

The `hx-confirm` attribute allows you to confirm an action before issuing a request. This can be useful
in cases where the action is destructive and you want to ensure that the user really wants to do it.

## Syntax

```html
<button hx-delete="/account" hx-confirm="Are you sure?">Delete Account</button>
```

Here is an example:

```html
<button hx-delete="/account" hx-confirm="Are you sure you wish to delete your account?">
  Delete My Account
</button>
```

## Event details

The [`htmx:confirm`](/reference/events/htmx-confirm) event is fired before every request. Its `detail` contains:

* `ctx` - the request context object; the confirm message is at `ctx.confirm` and the triggering element is at `ctx.sourceElement`
* `issueRequest()` - call this to proceed with the request
* `dropRequest()` - call this to cancel the request

## Notes

* `hx-confirm` uses the browser's `window.confirm` by default. You can customize this behavior by
  listening to the [`htmx:confirm`](/reference/events/htmx-confirm) event.

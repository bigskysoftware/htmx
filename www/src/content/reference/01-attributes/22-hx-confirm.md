---
title: "hx-confirm"
description: "Shows confirmation dialog before request"
---

The `hx-confirm` attribute asks for confirmation before issuing a request.

Use it for destructive or irreversible actions.

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

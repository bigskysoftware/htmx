---
title: "htmx:confirm"
description: "Show confirmation dialog before request"
---

The `htmx:confirm` event is fired on every request trigger, allowing custom confirmation dialogs or request cancellation logic. Elements with [`hx-confirm`](/reference/attributes/hx-confirm) use this event to show a confirmation dialog, but the event fires even on elements without `hx-confirm` — it just isn't cancelled by default.

## When It Fires

Before a request is sent, on every triggered request.

## Event Detail

- `ctx` - Request context object
- `issueRequest` - Callback function to call to proceed with the request
- `dropRequest` - Callback function to call to cancel the request

If you call `evt.preventDefault()`, you **must** call either `issueRequest()` or `dropRequest()`. Failing to call one of them will leave the request pending indefinitely.

## Example

```javascript
htmx.on('htmx:confirm', (evt) => {
  // Ignore elements that don't use hx-confirm
  if (!evt.detail.target.hasAttribute('hx-confirm')) return;

  evt.preventDefault(); // Prevent default confirm dialog

  // Show custom modal
  showCustomModal(evt.detail.ctx.confirmMessage).then((confirmed) => {
    if (confirmed) {
      evt.detail.issueRequest(); // User confirmed — proceed
    } else {
      evt.detail.dropRequest(); // User cancelled — drop the request
    }
  });
});
```

Cancel the default event and call either `issueRequest()` to proceed with the request or `dropRequest()` to cancel it.

---
title: "htmx:confirm"
description: "Show confirmation dialog before request"
---

The `htmx:confirm` event fires only when an element has an [`hx-confirm`](/reference/attributes/hx-confirm) attribute. It allows you to replace the default `window.confirm()` dialog with a custom confirmation UI.

## When It Fires

After the request context is built, before the request is sent, when the triggering element has `hx-confirm` set.

## Event Detail

- `ctx` - Request context object
- `issueRequest` - Callback function to call to proceed with the request
- `dropRequest` - Callback function to call to cancel the request

If you call `evt.preventDefault()`, you **must** call either `issueRequest()` or `dropRequest()`. Failing to call one of them will leave the request pending indefinitely.

## Example

```javascript
htmx.on('htmx:confirm', (evt) => {
  evt.preventDefault(); // Prevent default window.confirm() dialog

  // Show custom modal
  showCustomModal(evt.detail.ctx.confirm).then((confirmed) => {
    if (confirmed) {
      evt.detail.issueRequest(); // User confirmed — proceed
    } else {
      evt.detail.dropRequest(); // User cancelled — drop the request
    }
  });
});
```

Cancel the default event and call either `issueRequest()` to proceed with the request or `dropRequest()` to cancel it.

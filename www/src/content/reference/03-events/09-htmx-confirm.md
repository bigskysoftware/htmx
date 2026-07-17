---
title: "htmx:confirm"
description: "Fires before handling `hx-confirm`"
---

The `htmx:confirm` event fires before htmx handles [`hx-confirm`](/reference/attributes/hx-confirm).

Use it to replace the default confirmation UI or cancel the request.

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
  if (!evt.detail.ctx.sourceElement.hasAttribute('hx-confirm')) return;

  evt.preventDefault(); // Prevent default confirm dialog

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

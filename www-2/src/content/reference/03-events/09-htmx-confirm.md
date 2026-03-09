---
title: "htmx:confirm"
description: "Show confirmation dialog before request"
---

Fired when `hx-confirm` is present on an element, allowing custom confirmation dialogs.

## When It Fires

Before a request is sent, when the element has an `hx-confirm` attribute.

## Event Detail

- `ctx` - Request context object
- `issueRequest` - Callback function to call if user confirms

## Example

```javascript
htmx.on('htmx:confirm', (evt) => {
  evt.preventDefault(); // Prevent default confirm dialog

  // Show custom modal
  showCustomModal(evt.detail.ctx.confirmMessage).then(() => {
    evt.detail.issueRequest(); // User confirmed
  });
});
```

Cancel the default event and call `issueRequest()` to proceed with the request.

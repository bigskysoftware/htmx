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

This will show a confirmation using the browser’s `window.confirm` dialog with the message "Are you sure?" before issuing the request to `/account`. If the user clicks "Cancel", the request will not be sent.

### JavaScript evaluation

`hx-confirm` may also contain JavaScript by using the `js:` prefix. The JavaScript must return a Promise that resolves to a boolean value. If the Promise resolves to `true`, the request will be sent; if it resolves to `false`, the request will be canceled.

```html
<button hx-delete="/account" hx-confirm="js:<Promise>">Delete Account</button>
```

#### Example

```html
<button hx-delete="/account" hx-confirm="js:confirmDelete()">Delete Account</button>
```

```js
function confirmDelete() {
  return new Promise(resolve => {
    const confirm = false; 
    // Custom confirmation logic
    resolve(confirm);
  });
}
```

## Notes

* `hx-confirm` triggers the [`htmx:confirm`](/reference/events/htmx-confirm) event, which can be used to customize the confirmation behavior.

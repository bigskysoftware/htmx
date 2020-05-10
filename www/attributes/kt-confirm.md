---
layout: layout.njk
title: </> kutty - kt-confirm
---

## `kt-confirm`

The `kt-confirm` attribute allows you to confirm an action before issuing a request.  This can be useful
in cases where the action is destructive and you want to ensure that the user really wants to do it.

Here is an example:

```html
<button kt-delete="/account" kt-confirm="Are you sure you wish to delete your account?">
  Delete My Account
</button>
```

### Notes

* `kt-confirm` is inherited and can be placed on a parent element

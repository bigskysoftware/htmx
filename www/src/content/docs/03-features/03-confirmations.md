---
title: "Confirmations"
description: "Require user confirmation before issuing requests"
---

Often you will want to confirm an action before issuing a request. htmx supports the [`hx-confirm`](/reference/attributes/hx-confirm)
attribute, which allows you to confirm an action using a simple javascript dialog:

```html
<button hx-delete="/account" hx-confirm="Are you sure you wish to delete your account?">
    Delete My Account
</button>
```

`hx-confirm` may also contain JavaScript by using the `js:` or `javascript:` prefix. In this case
the JavaScript will be evaluated and, if a promise is returned, it will wait until the promise
resolves with a `true` value to continue

```html

<script>
    async function swalConfirm() {
        let result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        })
        return result.isConfirmed
    }
</script>
<button hx-delete="/account" hx-confirm="js:swalConfirm()">
    Delete My Account
</button>
```

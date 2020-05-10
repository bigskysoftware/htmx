---
layout: layout.njk
title: </> kutty - kt-prompt
---

## `kt-prompt`

The `kt-prompt` attribute allows you to show a prompt before issuing a request.  The value of
the prompt will be included in the requst in the `X-KT-Prompt` header.

Here is an example:

```html
<button kt-delete="/account" kt-prompt="Enter your account name to confirm deletion">
  Delete My Account
</button>
```

### Notes

* `kt-prompt` is inherited and can be placed on a parent element

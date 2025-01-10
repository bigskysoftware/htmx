+++
title = "hx-prompt-default"
+++

The `hx-prompt-default` attribute sets the default value for a prompt shown via [`hx-prompt`](@/attributes/hx-prompt.md). 

Here is an example:

```html
<button hx-patch="/update-name" hx-prompt="Enter a new name" hx-prompt-default="My Thing 123">
  Update name
</button>
```

## Notes

* `hx-prompt-default` is inherited and can be placed on a parent element

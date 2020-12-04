---
layout: layout.njk
title: </> htmx - hx-oob-target
---

## `hx-oob-target`

The `hx-oob-target` attribute allows you specify the target for [`hx-swap-oob`](/attributes/hx-swap-oob)

Consider the following response HTML:

```html
<div>
 ...
</div>
<div data-foo="" hx-oob-target="[data-foo]" hx-swap-oob="true">
    Saved!
</div>

```

Just as with the default usage of `hx-swap-oob`, the first div will be swapped into the
target the usual manner.  The second div, however, will be swapped in
as a replacement for the element with the `data-foo` attribute.

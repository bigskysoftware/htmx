---
title: "hx-morph-skip"
description: "Freezes an element during a morph swap"
---

The `hx-morph-skip` attribute leaves an element untouched during a [morph swap](/reference/attributes/hx-swap#innermorph). htmx copies no attributes and morphs no children.

## Syntax

```html
<custom-widget hx-morph-skip>
    <!-- htmx leaves this element and its children alone -->
</custom-widget>
```

The value of the attribute is ignored.

## Notes

* Use it for third party widgets, web components, and elements with animations or client-side state.
* To update the attributes but keep the children, use [`hx-morph-skip-children`](/reference/attributes/hx-morph-skip-children).
* It applies to morph swaps only. It has no effect on `innerHTML`, `outerHTML`, or the other swap styles.
* htmx matches the attribute through the [`htmx.config.morphSkip`](/reference/config/htmx-config-morphSkip) selector, which defaults to `[hx-morph-skip]`. If you set that option to another selector, this attribute stops working.
* htmx matches the element in the current page, not in the response.

## See Also

* [`hx-morph-skip-children`](/reference/attributes/hx-morph-skip-children)
* [`hx-preserve`](/reference/attributes/hx-preserve)
* [`htmx.config.morphSkip`](/reference/config/htmx-config-morphSkip)

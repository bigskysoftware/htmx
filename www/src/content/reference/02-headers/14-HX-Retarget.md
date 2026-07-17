---
title: "HX-Retarget"
description: "Overrides swap target from server"
---

The `HX-Retarget` response header overrides the element that will receive the swapped content, replacing whatever `hx-target` was set on the triggering element.

## Usage

```http
HX-Retarget: #new-target
```

The value is a CSS selector for the new target element.


Redirect a form submission result to a different container:

```python
return Response(
    content,
    headers={'HX-Retarget': '#notifications'}
)
```

## Notes

- Overrides `hx-target` on the source element
- Evaluated after the response is received, before swapping

See also: [`hx-target`](/reference/attributes/hx-target), [`HX-Reswap`](/reference/headers/HX-Reswap)

## See Also

- [`HX-Target`](/reference/headers/HX-Target)

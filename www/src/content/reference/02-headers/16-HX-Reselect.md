---
title: "HX-Reselect"
description: "Override the content selection from the server"
---

The `HX-Reselect` response header overrides which part of the response is used for swapping, replacing whatever `hx-select` was set on the triggering element.

## Syntax

```http
HX-Reselect: #content
```

The value is a CSS selector applied to the response HTML to extract the content to swap in.

## Example

Return a full page but tell htmx to only use a specific fragment:

```python
return Response(
    full_page_html,
    headers={'HX-Reselect': '#main-content'}
)
```

## Notes

- Overrides `hx-select` on the source element
- Evaluated after the response is received, before swapping

See also: [`hx-select`](/reference/attributes/hx-select), [`HX-Retarget`](/reference/headers/HX-Retarget), [`HX-Reswap`](/reference/headers/HX-Reswap)

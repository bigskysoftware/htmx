---
title: "HX-Refresh"
description: "Trigger a full page reload"
---

The `HX-Refresh` response header, when set to `true`, reloads the entire page.

Use this when you need to reset all page state after an action.

## Example

```http
HX-Refresh: true
```

```python
return Response(
    "Changes saved",
    headers={'HX-Refresh': 'true'}
)
```

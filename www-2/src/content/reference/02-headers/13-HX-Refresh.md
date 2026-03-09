---
title: "HX-Refresh"
description: "Trigger a full page reload"
---

Set to `true` to reload the entire page.

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

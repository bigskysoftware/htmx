---
title: "HX-Redirect"
description: "Client-side redirect to a new URL"
---

Redirect to a new URL with a full page reload.

Use this when redirecting outside your htmx application or when you need a full page refresh. For AJAX navigation, use [`HX-Location`](/reference/headers/hx-location) instead.

## Example

```http
HX-Redirect: /dashboard
```

```python
return Response(
    "Redirecting...",
    headers={'HX-Redirect': '/dashboard'}
)
```

See also: [`HX-Location`](/reference/headers/hx-location)

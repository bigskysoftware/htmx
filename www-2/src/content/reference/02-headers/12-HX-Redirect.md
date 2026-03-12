---
title: "HX-Redirect"
description: "Client-side redirect to a new URL"
---

Redirect to a new URL with a full page reload.

Use this when redirecting to non-htmx endpoints, or to pages with different `<head>` content or scripts that require a full browser load. For AJAX navigation that stays within your htmx application, use [`HX-Location`](/reference/headers/hx-location) instead.

Response headers are not processed on 3xx response codes. Return a 2xx status when using this header.

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

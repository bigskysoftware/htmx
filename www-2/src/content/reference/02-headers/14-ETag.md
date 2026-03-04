---
title: "ETag"
description: "Cache identifier for the response content"
---

# ETag

A unique identifier for the response content.

htmx stores this value and sends it as `If-None-Match` on subsequent requests. Return `304 Not Modified` when the ETag matches to save bandwidth.

## Example

```http
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

```python
return Response(
    content,
    headers={'ETag': calculate_etag(content)}
)
```

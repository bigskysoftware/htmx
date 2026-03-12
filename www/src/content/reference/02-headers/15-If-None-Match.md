---
title: "If-None-Match"
description: "ETag from previous response for caching"
---

The `If-None-Match` request header is sent when the element has a cached ETag from a previous response.

Use this for conditional requests. Return `304 Not Modified` if content hasn't changed to save bandwidth.

## Example

Server checks the ETag.

```http
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

```python
etag = request.headers.get('If-None-Match')
if etag == current_etag:
    return Response(status=304)
else:
    return Response(content, headers={'ETag': current_etag})
```

---
title: "Accept"
description: "Content types htmx accepts from the server"
---

# Accept

Set to `text/html, text/event-stream` on all htmx requests.

This tells the server that htmx accepts both HTML and SSE streams.

## Example

```http
Accept: text/html, text/event-stream
```

```python
accept = request.headers.get('Accept')
if 'text/event-stream' in accept:
    return stream_sse_events()
else:
    return render_html()
```

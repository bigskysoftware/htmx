---
title: "Last-Event-ID"
description: "Last received SSE event ID for reconnection"
---

The `Last-Event-ID` request header is sent during SSE reconnection to resume from the last received event.

The server uses this to skip duplicate events and continue streaming from the correct point.

## Example

```http
Last-Event-ID: 12345
```

```python
last_id = request.headers.get('Last-Event-ID')
# Resume events after this ID
events = get_events(after_id=last_id)
```

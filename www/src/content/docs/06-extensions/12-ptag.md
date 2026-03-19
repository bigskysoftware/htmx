---
title: "PTag"
description: "Per-element polling tags that let the server skip swaps when content hasn't changed."
keywords: ["ptag", "polling", "etag", "conditional", "caching"]
---

The `ptag` extension provides per-element polling tags (metadata) that let your server skip swaps when content hasn't changed. It works like ETags in HTTP, but at the application and element level rather than the protocol and URL level.

Useful in polling scenarios where responses depend on what content has already been shipped to the client.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-ptag.js"></script>
```

## How It Works

When a response includes an `HX-PTag` header, the extension stores the value on the source element. On subsequent requests from that element, the stored value is sent as an `HX-PTag` request header.

The server can use the incoming `HX-PTag` value to determine the appropriate response. If nothing has changed, the server responds with `304 Not Modified` and htmx skips the swap.

## Usage

### Basic Polling

```html
<div hx-get="/news" hx-trigger="every 3s">
    Latest News...
</div>
```

The server returns content along with a ptag header:

```
HTTP/1.1 200 OK
HX-PTag: "v42"

<div>Breaking: htmx 4 released!</div>
```

On the next poll, htmx sends:

```
GET /news HTTP/1.1
HX-PTag: "v42"
```

If nothing changed, the server responds with `304` and no body.

### Server-Side Example

```python
@app.get("/news")
def news(request):
    current_tag = compute_news_hash()
    client_tag = request.headers.get("HX-PTag")

    if client_tag == current_tag:
        return Response(status_code=304)

    return Response(
        content=render_news(),
        headers={"HX-PTag": current_tag}
    )
```

### Setting an Initial PTag

Use the `hx-ptag` attribute to set an initial polling tag so the very first request includes it:

```html
<div hx-get="/news" hx-trigger="every 3s" hx-ptag="v42">
    Latest News...
</div>
```

Useful when the server renders the initial page and knows the current version.

### Using a Timestamp PTag

If the ptag is a timestamp, the server can use it to determine *what* new content to send, not just *whether* to send it.

A chat endpoint can use the ptag to only return messages since the last poll:

```html
<div hx-get="/messages" hx-trigger="every 2s" hx-ptag="2026-03-13T00:00:00Z">
</div>
```

```python
@app.get("/messages")
def messages(request):
    since = request.headers.get("HX-PTag")
    now = datetime.utcnow().isoformat() + "Z"
    new_messages = get_messages_between(since, now)
    if not new_messages:
        return Response(status_code=304)

    return Response(
        content=render_messages(new_messages),
        headers={"HX-PTag": now}
    )
```

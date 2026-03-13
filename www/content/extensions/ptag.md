+++
title = "htmx PTag Extension"
+++

The `ptag` extension provides per-element polling tags, or metadata, that let your server skip swaps when content
hasn't changed. It functions something like E-Tags do in HTTP, but works at the _application_ and _element_ level, rather
than at the protocol and RUL level.

It is useful, for example, in polling scenarios where responses depend on what content that has already been shipped
to the client, allowing for state to be communicated and updated at the request level.

## Installing

Include the extension after htmx:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-ptag.js"></script>
```

## Description

When this extension is loaded a response may include an `HX-PTag` header, the extension stores the value of this 
on the source element. On subsequent requests from that element, the stored value is sent as an `HX-PTag` request header.

The server can then use the incoming `HX-PTag` value to determine the appropriate response.  For example, if the ptag
indicates nothing has changed, the server may respond with a `304 Not Modified` and htmx will not make any changes to
the DOM.

## Usage

### Basic Polling Example

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

If nothing changed, the server responds with `304` and no body — htmx skips the swap.

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

Use the `hx-ptag` attribute to set an initial polling tag, so the very first request includes it:

```html
<div hx-get="/news" hx-trigger="every 3s" hx-ptag="v42">
    Latest News...
</div>
```

This is useful when the server renders the initial page and knows the current version.

### Using a Timestamp PTag

If the ptag is a _timestamp_, the server can use it to determine *what* new content to send, not just
*whether* to send it.

For example, a chat endpoint can use the ptag to only return messages since the last poll:

```html
<div hx-get="/messages" hx-trigger="every 2s" hx-ptag="2026-03-13T00:00:00Z">
</div>
```

Here is sample server side code using this timestamp

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

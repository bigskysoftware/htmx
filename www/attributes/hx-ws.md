---
layout: layout.njk
title: </> htmx - hx-ws
---

## *EXPERIMENTAL* `hx-ws` 

The `hx-ws` allows you to work with [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
directly from HTML.  The value of the attribute can be one or more of the following, separated by commas:

* `connect:<url>` or `connect:<prefix>:<url>` - A URL to establish an `WebSocket` connection against.
* Prefixes `ws` or `wss` can optionally be specified. If not specified, HTMX defaults to add the location's scheme-type, host and port to have browsers send cookies via websockets.
* `send` - Sends a message to the nearest websocket based on the trigger value for the element (either the natural event
of the event specified by [`hx-trigger`])

Here is an example:

```html
  <div hx-ws="connect:/chatroom">
    <div id="chat_room">
      ...
    </div>
    <form hx-ws="send">
        <input name="chat_message">
    </form>
  </div>
```

This example establishes a WebSocket to the `chatroom` end point.  Content that is sent down from the websocket will
be parsed as HTML and swapped in by the `id` property, using the same logic as [Out of Band Swaps](/attributes/hx-swap-oob).

The form uses the `send` syntax to indicate that when it is submitted, the form values should be serialized as JSON
and send to the nearest enclosing `WebSocket`.

The serialized values will include a field, `HEADERS`, that includes the headers normally submitted with an htmx
request.

After an unexpected connection loss due to `Abnormal Closure`, `Service Restart` or `Try Again Later`,
reconnecting is tried until successful.
The default reconnection interval is implemented with the full-jitter exponential-backoff algorithm.
Own implementations can be provided by setting `htmx.config.wsReconnectDelay` to a function with
`retryCount` as its only parameter.

### File inputs

The JSON websocket request will include any file inputs. There are multiple
ways files can be encoded into websocket requests. Whichever way, the part of
the JSON request corresponding the file will be object, with the field
`serialization` indicating to the websocket server how the file has been
serialized as well fields with the metadata about the file: `name`,
`lastModified`, `size` and `type`.

The mode for serialization can be modified using `hx-encoding`. The default
mode for value if no `hx-encoding` is specified is `multipart/json-files-oob`.
In this case, for each request, multiple websocket messages will be sent from
the client: one for the initial request, and subsequently one for each file
which is part of the request. In this case, the object corresponding to the
file have `serialization` set to `file/oob` and it will also contain an
`offset` field containing a 0-based offset into the following messages. The
server program must then gather these offsets and use them to determine how
many extra packets to read and include in the initial message.

The other mode available from `hx-encoding` is `multipart/json-files-inline`.
This mode sends a single request containing the contents of the files inline.
This mode is easier to handle server-side, but it is only appropriate for usage
with small files, since it will load the whole file into memory when
constructing the request. In this case files with mime types beginning with
`text/` have a `serialization` set to `file/inline-text` and contain a `body`
field with the contents of the file as text. For other types of files,
`serialization` will be set to `file/inline-base64` and `body` field will be
base64 encoded.

To clarify, consider the following example:

```html
<div hx-ws="connect:/session">
  <form hx-ws="send" hx-encoding="multipart/json-files-oob">
    <input type="file" name="photo">
    <input type="file" name="markdown_bio">
    <input type="submit">
  </form>
</div>
```

In this case, 3 websocket messages would be sent, the first of which would be:

```json
{
  "photo": {
    "serialization": "multipart/json-files-oob",
    "offset": 0,
    "name": "photo.jpg",
    "lastModified": 1485903600000,
    "size": 8192,
    "type": "image/jpeg"
  },
  "markdown_bio": {
    "serialization": "multipart/json-files-oob",
    "offset": 1,
    "name": "bio.md",
    "lastModified": 1485903600000,
    "size": 13,
    "type": "text/markdown"
  }
}
```

The next two message would then contain the contents of photo and markdown bio respectively as binary websocket messages.

Now consider if `hx-encoding` was set to `multipart/json-files-inline`. In this
case the request would be the following:

```json
{
  "photo": {
    "serialization": "file/inline-base64",
    "body": "TG9yZW0gaXBzdW0gZG9sciBzaXI=",
    "name": "photo.jpg",
    "lastModified": 1485903600000,
    "size": 8192,
    "type": "image/jpeg"
  },
  "markdown_bio": {
    "serialization": "file/inline-text",
    "body": "*Lorem ipsum*",
    "name": "bio.md",
    "lastModified": 1485903600000,
    "size": 13,
    "type": "text/markdown"
  }
}
```

### Notes

* `hx-ws` is not inherited

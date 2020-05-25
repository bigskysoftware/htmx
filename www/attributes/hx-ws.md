---
layout: layout.njk
title: </> htmx - hx-ws
---

## *EXPERIMENTAL* `hx-ws` 

The `hx-ws` allows you to work with [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
directly from HTML.  The value of the attribute can be one or more of the following, separated by commas:

* `source:<url>` - A URL to establish an `WebSocket` against (NB: do not include the `wss:` protocol prefix)
* `send:<event_name>` - Sends a message to the nearest websocket

Here is an example:

```html
  <div hx-ws="source:/chatroom">
    <div id="chat_room">
      ...
    </div>
    <form hx-ws="send:submit">
        <input name="chat_message">
    </form>
  </div>
```

This example establishes a WebSocket to the `chatroom` end point.  Content that is send down from the websocket will
be parsed as HTML and swapped in by the `id` property, similar to [Out of Band Swaps](/attributes/hx-swap-oob).

The form uses the `send:` syntax to indicate that when it is submitted, the form values should be serialized as JSON
and send to the nearest enclosing `WebSocket`.

The serialized values will include a field, `HEADERS`, that includes the headers normally submitted with an htmx
request.

### Notes

* `hx-ws` is not inherited

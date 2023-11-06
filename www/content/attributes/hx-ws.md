+++
title = "hx-ws"
+++

*Note: This attribute will be migrated to an extension in htmx 2.0, which is available now.  Please visit the 
[WebSockets extension page](@/extensions/web-sockets.md) to learn about the new implementation of Web Sockets as an extension.*

The `hx-ws` allows you to work with [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
directly from HTML.  The value of the attribute can be one or more of the following, separated by commas:

* `connect:<url>` or `connect:<prefix>:<url>` - A URL to establish an `WebSocket` connection against.
* Prefixes `ws` or `wss` can optionally be specified. If not specified, HTMX defaults to add the location's scheme-type, host and port to have browsers send cookies via websockets.
* `send` - Sends a message to the nearest websocket based on the trigger value for the element (either the natural event
or the event specified by [`hx-trigger`])

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
be parsed as HTML and swapped in by the `id` property, using the same logic as [Out of Band Swaps](@/attributes/hx-swap-oob.md).

The form uses the `send` syntax to indicate that when it is submitted, the form values should be serialized as JSON
and send to the nearest enclosing `WebSocket`.

The serialized values will include a field, `HEADERS`, that includes the headers normally submitted with an htmx
request.

After an unexpected connection loss due to `Abnormal Closure`, `Service Restart` or `Try Again Later`,
reconnecting is tried until successful.
The default reconnection interval is implemented with the full-jitter exponential-backoff algorithm.
Own implementations can be provided by setting `htmx.config.wsReconnectDelay` to a function with
`retryCount` as its only parameter.


### Test Web Sockets Server

Htmx includes a WebSockets test server with many more examples of how to use Server Sent Events.  Download the htmx source code from GitHub and navigate to /test/ws-sse to experiment.

## Notes

* `hx-ws` is not inherited

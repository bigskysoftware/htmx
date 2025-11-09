+++
title = "hx-stream"
+++

The `hx-stream` attribute configures Server-Sent Events (SSE) streaming behavior for the element.

When used with `hx-get` or other request attributes, htmx will handle SSE responses from the server, processing messages as they arrive.

## Syntax

```html
<div hx-get="/events" hx-stream="mode:continuous,maxRetries:10">
  Waiting for events...
</div>
```

## Configuration Options

The value is a comma-separated list of configuration options:

| Option | Values | Description |
|--------|--------|-------------|
| `mode` | `once`, `continuous` | Whether to close after first message or keep listening (default: `once`) |
| `maxRetries` | number | Maximum reconnection attempts (default: `Infinity`) |
| `initialDelay` | milliseconds | Initial delay before first reconnect (default: 500) |
| `maxDelay` | milliseconds | Maximum delay between reconnects (default: 30000) |
| `pauseHidden` | `true`, `false` | Pause stream when page is hidden (default: `false`) |

## Basic Usage

### One-Time Stream

```html
<div hx-get="/notifications" hx-stream="mode:once">
  <!-- Will close connection after receiving first message -->
</div>
```

### Continuous Stream

```html
<div hx-get="/live-updates"
     hx-stream="mode:continuous"
     hx-trigger="load">
  <!-- Keeps connection open for multiple messages -->
</div>
```

## Advanced Configuration

### Custom Retry Behavior

```html
<div hx-get="/events"
     hx-stream="mode:continuous,maxRetries:5,initialDelay:1000,maxDelay:10000">
  Live Feed
</div>
```

### Pause When Hidden

```html
<div hx-get="/stock-prices"
     hx-stream="mode:continuous,pauseHidden:true">
  Stock Ticker
</div>
```

## Server-Side Implementation

The server should return a response with `Content-Type: text/event-stream`:

```python
@app.route('/events')
def events():
    def generate():
        yield 'data: <div>Message 1</div>\n\n'
        yield 'data: <div>Message 2</div>\n\n'

    return Response(generate(), mimetype='text/event-stream')
```

## SSE Message Format

Standard SSE format:

```
data: <div>HTML content here</div>

event: custom-event
data: <div>Custom event content</div>

id: 123
data: <div>Message with ID</div>
```

## Events

htmx triggers several events during SSE streaming:

* `htmx:before:sse:stream` - before starting stream
* `htmx:after:sse:stream` - after stream ends
* `htmx:before:sse:message` - before processing each message
* `htmx:after:sse:message` - after processing each message
* `htmx:before:sse:reconnect` - before attempting reconnect

## Notes

* SSE is built into htmx 4.x (no extension needed)
* Each message's data is swapped into the target element
* Default swap is `innerHTML`
* Use `hx-swap` to change swap strategy
* Reconnection uses exponential backoff with jitter
* Global defaults can be set via `htmx.config.streams`

## See Also

* [Streaming Responses](@/docs.md#streaming-responses) in the docs
* [`hx-swap`](@/attributes/hx-swap.md)
* [`hx-trigger`](@/attributes/hx-trigger.md)
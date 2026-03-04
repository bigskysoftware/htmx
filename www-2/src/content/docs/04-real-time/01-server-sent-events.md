---
title: "Streaming Responses"
description: "Stream server updates using Server-Sent Events"
---

# Streaming Responses

htmx 4 has built-in support for Streaming Responses Server-Sent Events (SSE).

The typical `hx-get`, `hx-post`, `hx-put`, `hx-patch`, or `hx-delete` attributes can trigger a streaming response. When
the server responds with `Content-Type: text/event-stream` instead of `Content-Type: text/html`, htmx automatically
handles the stream.

Each SSE message with a `data:` line (and no `event:` line) is processed like a regular htmx response, respecting
`hx-target`, `hx-select`, and `hx-swap` attributes.

Like [fetch-event-source](https://github.com/Azure/fetch-event-source), htmx's custom SSE implementation supports
request bodies, custom headers, and all HTTP methods (not just GET), and Page Visibility API
integration (using the `pauseHidden` modifier).

### Basic Usage

```html
<button hx-get="/stream" hx-target="#stream-output" hx-swap="innerHTML">
    Stream Response
</button>

<div id="stream-output"></div>
```

The server sends SSE messages with `data:` lines:

```
data: H

data: He

// ...

data: Hello partner!

```

Each message replaces the target element's content. The stream processes until the connection closes, then stops.
No reconnection occurs by default.

### Stream Modes

The `hx-stream` attribute controls reconnection behavior. The default mode is `once`, so it doesn't need to be
specified.

- `once` (default): Process stream until connection closes. No reconnection.
- `continuous`: Reconnect automatically if connection drops. Retries with exponential backoff.

```html
<body hx-get="/updates" hx-stream="continuous" hx-trigger="load">
...
</body>
```

**Note:** `hx-stream="continuous"` is primarily intended for use with `<htmx-action type="partial">` to enable real-time
updates to multiple parts of the page via a permanently open SSE connection.

### Custom Events

SSE `event:` lines trigger custom DOM events. When an `event:` line is present, htmx fires that event instead of
performing a normal swap.

Use this for lightweight updates without swapping DOM elements.

```html
<button hx-get="/progress"
        hx-on:progress="find('#bar').style.width = event.detail.data + '%'">
    Start
</button>
```

Server sends custom events:

```
event: progress
data: 50

event: progress
data: 100

```

### Configuration

You can configure the global streaming config in `htmx.config.streams`:

```html

<meta name="htmx:config" content='{
  "streams": {
    "mode": "once",
    "maxRetries": 3,
    "initialDelay": 500,
    "maxDelay": 30000,
    "pauseHidden": false
  }
}'>
```

- `mode`: `'once'` or `'continuous'`
- `maxRetries`: Maximum reconnection attempts (default: `Infinity`)
- `initialDelay`: First reconnect delay in ms (default: `500`)
- `maxDelay`: Max backoff delay in ms (default: `30000`)
- `pauseHidden`: Pause stream when page is hidden (default: `false`). Uses the Page Visibility API to pause the stream
  when the browser window is minimized or the tab is in the background.

You can override these settings per-element using the `hx-stream` attribute:

```html
<button hx-get="/stream"
        hx-stream="continuous maxRetries:10 initialDelay:1s pauseHidden:true">
    Start
</button>
```

### Events

- `htmx:before:sse:stream`: Fired before processing stream
- `htmx:before:sse:message`: Fired before each message swap. Cancel with `event.detail.message.cancelled = true`
- `htmx:after:sse:message`: Fired after each message swap
- `htmx:after:sse:stream`: Fired when stream ends
- `htmx:before:sse:reconnect`: Fired before reconnection attempt. Cancel with `event.detail.reconnect.cancelled = true`

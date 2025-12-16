# WebSocket Extension (hx-ws)

This document describes the WebSocket extension implementation for htmx 4.

## Overview

The `hx-ws` extension provides WebSocket support for htmx, enabling real-time bidirectional communication between the browser and server. It manages WebSocket connections efficiently through reference counting, automatic reconnection, and seamless integration with htmx's swap and event model.

## Core Architecture

### Connection Registry

The extension maintains a global connection registry that ensures:
- **Connection Pooling**: Multiple elements can share a single WebSocket connection to the same URL
- **Reference Counting**: Connections are automatically opened when the first element needs them and closed when the last element is removed
- **Reconnection Management**: Automatic reconnection with exponential backoff when connections drop

### Lifecycle Management

1. **Connection Establishment**: When an element with `hx-ws:connect` is processed, it increments the reference count for that WebSocket URL
2. **Element Cleanup**: When an element is removed from the DOM, it decrements the reference count
3. **Auto-Disconnect**: When the reference count reaches zero, the connection is closed automatically

## Attributes

### `hx-ws:connect`

Establishes a WebSocket connection to the specified URL.

```html
<div hx-ws:connect="ws://localhost:8080/chat" hx-trigger="load">
    <!-- Content updated via WebSocket messages -->
</div>
```

**Key Features:**
- Supports `hx-trigger` to control when the connection is established (default: explicit trigger required)
- Can set `hx-target` and `hx-swap` for default message handling
- Connection is shared across all elements using the same URL

### `hx-ws:send`

Sends data to the server via WebSocket.

**Form Submission:**
```html
<form hx-ws:send hx-trigger="submit">
    <input type="text" name="message">
    <button type="submit">Send</button>
</form>
```

**Button with Values:**
```html
<button hx-ws:send hx-vals='{"action":"increment"}' hx-trigger="click">
    Increment
</button>
```

**Explicit URL (establishes new connection):**
```html
<button hx-ws:send="ws://localhost:8080/actions" hx-vals='{"type":"ping"}'>
    Ping
</button>
```

**Data Sent:**
The extension sends a JSON object containing:
```json
{
    "type": "request",
    "request_id": "unique-id",
    "event": "click",
    "headers": {
        "HX-Request": "true",
        "HX-Current-URL": "https://example.com/page",
        "HX-Trigger": "element-id",
        "HX-Target": "#target"
    },
    "values": { /* form data or hx-vals - arrays for multi-value fields */ },
    "path": "wss://example.com/ws",
    "id": "element-id"
}
```

| Field | Description |
|-------|-------------|
| `type` | Always `"request"` for client-to-server messages |
| `request_id` | Unique ID for request/response matching |
| `event` | The DOM event type that triggered the send (e.g., `"click"`, `"submit"`, `"change"`) |
| `headers` | HTMX-style headers for server-side routing/processing |
| `values` | Form data and `hx-vals` - multi-value fields preserved as arrays |
| `path` | The normalized WebSocket URL |
| `id` | Element ID (only if the triggering element has an `id` attribute) |

## Message Format

### Server → Client (JSON Envelope)

Messages from the server should be JSON objects with this structure:

```json
{
    "channel": "ui",           // Optional: Channel identifier (default: "ui")
    "format": "html",          // Optional: Message format (default: "html")
    "target": "#element-id",   // Optional: specific target selector
    "swap": "innerHTML",       // Optional: swap strategy
    "payload": "<div>...</div>", // The actual content
    "request_id": "unique-id"  // Optional: matches original request
}
```

**Minimal Example** (using defaults):
```json
{
    "payload": "<div>Hello World</div>"
}
```

**Standard Channels:**
- **`ui`** (default): UI updates (HTML content swapping)
  - `format: "html"` (default): Swap HTML content into target element
- **Custom channels**: Emit `htmx:wsMessage` event for application handling

**Legacy Format (Deprecated):**
```html
<hx-partial id="target-id">
    <div>Content</div>
</hx-partial>
```

### Non-JSON Messages

If the server sends non-JSON data, the extension emits an `htmx:wsUnknownMessage` event with the raw data, allowing applications to handle custom protocols.

## Configuration

Configure via `htmx.config.websockets`:

```javascript
htmx.config.websockets = {
    reconnect: true,              // Enable auto-reconnect (default: true)
    reconnectDelay: 1000,         // Initial delay in ms (default: 1000)
    reconnectMaxDelay: 30000,     // Max delay in ms (default: 30000)
    reconnectJitter: true,        // Add jitter to reconnect delays (default: true)
    autoConnect: false,           // Auto-connect on page load (default: false)
    pendingRequestTTL: 30000      // TTL for pending requests in ms (default: 30000)
};
```

**Reconnection Strategy:**
- Exponential backoff: `delay = min(reconnectDelay * 2^(attempts-1), reconnectMaxDelay)`
- Jitter adds ±25% randomization to avoid thundering herd
- Attempts counter resets to 0 on successful connection
- To implement visibility-aware behavior, listen for `htmx:ws:reconnect` and cancel if `document.hidden`

## Events

### Connection Events

**`htmx:before:ws:connect`**
- Triggered before establishing a WebSocket connection
- `detail`: `{ url, element }`
- Cancellable via `preventDefault()`

**`htmx:after:ws:connect`**
- Triggered after successful connection
- `detail`: `{ url, element, socket }`

**`htmx:ws:reconnect`**
- Triggered before each reconnection attempt
- `detail`: `{ url, attempts }`

**`htmx:ws:close`**
- Triggered when connection closes
- `detail`: `{ url, code, reason }` (code and reason from WebSocket CloseEvent)

**`htmx:ws:error`**
- Triggered on connection error
- `detail`: `{ url, error }`

### Message Events

**`htmx:before:ws:send`**
- Triggered before sending a message
- `detail`: `{ data, element, url }` (data is the message object, can be modified)
- Cancellable via `preventDefault()`

**`htmx:after:ws:send`**
- Triggered after message is sent
- `detail`: `{ data, url }` (data is the sent message object)

**`htmx:wsSendError`**
- Triggered when send fails (e.g., no connection URL found)
- `detail`: `{ element }`

**`htmx:wsMessage`**
- Triggered for any non-UI channel message (json, audio, binary, custom channels, etc.)
- `detail`: `{ channel, format, payload, element, ... }` (entire envelope plus target element)
- Use this event to implement custom message handling for your application

**`htmx:wsUnknownMessage`**
- Triggered for messages that fail JSON parsing (invalid JSON)
- `detail`: `{ data, parseError }` (raw message data and parse error)

## Implementation Details

### URL Normalization

WebSocket URLs are automatically normalized:
- Relative paths (`/ws/chat`) are converted to absolute WebSocket URLs based on current page location
- `http://` is converted to `ws://`
- `https://` is converted to `wss://`
- Protocol-relative URLs (`//example.com/ws`) use `ws:` or `wss:` based on current page protocol

```html
<!-- All of these work: -->
<div hx-ws:connect="/ws/chat">          <!-- becomes wss://example.com/ws/chat on HTTPS -->
<div hx-ws:connect="ws://localhost:8080/ws">
<div hx-ws:connect="https://api.example.com/ws">  <!-- becomes wss://api.example.com/ws -->
```

### Trigger Semantics

**Important:** The `hx-trigger` attribute on WebSocket elements only supports **bare event names**. Trigger modifiers like `once`, `delay`, `throttle`, `target`, `from`, `revealed`, and `intersect` are **not supported** for WebSocket connection/send triggers.

```html
<!-- Supported: bare event names -->
<div hx-ws:connect="/ws" hx-trigger="load">
<div hx-ws:connect="/ws" hx-trigger="click">
<button hx-ws:send hx-trigger="click">

<!-- NOT supported: trigger modifiers -->
<div hx-ws:connect="/ws" hx-trigger="click delay:500ms">  <!-- delay ignored -->
<div hx-ws:connect="/ws" hx-trigger="intersect">          <!-- won't work -->
```

For complex connection control, use the `htmx:before:ws:connect` event:
```javascript
document.addEventListener('htmx:before:ws:connect', (e) => {
    if (someCondition) {
        e.preventDefault(); // Cancel connection
    }
});
```

### HTML Swapping

When a `channel: "ui"` message arrives, the extension uses htmx's internal `insertContent` API:

1. Determine target element (from message `target`, request context, or default `hx-target`)
2. Determine swap strategy (from message `swap`, or default `hx-swap`, or `innerHTML`)
3. Create a document fragment from the payload
4. Call `api.insertContent({target, swapSpec, fragment})`

This ensures WebSocket swaps get proper htmx behavior:
- All swap styles (innerHTML, outerHTML, beforebegin, afterend, etc.)
- Preserved elements (`hx-preserve`)
- Auto-focus handling
- Scroll handling
- Proper cleanup of removed elements
- `htmx.process()` called on newly inserted content (not the old target)

### Request-Response Matching

The extension generates a unique `request_id` for each `hx-ws:send`. When the server includes this `request_id` in the response, the extension:
- Swaps content into the element that originated the request
- Respects that element's `hx-target` and `hx-swap` attributes
- Enables request-response patterns over WebSocket

### Form Integration

Works seamlessly with htmx form handling:
- Collects form data using `api.collectFormData()`
- Processes `hx-vals` using `api.handleHxVals()`
- Respects `hx-include` for additional inputs
- Triggers standard htmx events

### Compatibility with htmx Core

The extension leverages htmx core APIs to avoid duplication:
- `api.attributeValue()`: Read prefixed attributes
- `api.parseTriggerSpecs()`: Parse trigger specifications
- `api.collectFormData()`: Gather form data
- `api.handleHxVals()`: Process hx-vals attribute
- `htmx.process()`: Initialize swapped content
- `htmx.trigger()`: Emit custom events
- `htmx.config.prefix`: Respect custom attribute prefixes

## Comparison to Original Design

The initial design concept proposed:

```html
<button hx-get="ws:/websocket">Send It...</button>
```

### What We Kept

✅ **Reference Counting**: Connections auto-close when last element is removed  
✅ **Connection Pooling**: Multiple elements share connections to the same URL  
✅ **Context Sending**: Form data and values sent as JSON  
✅ **Partial Responses**: Support for `<hx-partial>` (legacy)  
✅ **Request Matching**: `request_id` ties responses to originating elements

### What Changed

🔄 **Separate Attributes**: Used `hx-ws:connect` and `hx-ws:send` instead of overloading `hx-get`
- Clearer separation of concerns
- Better developer experience
- Avoids conflicts with HTTP methods

🔄 **JSON Envelope**: Standardized on JSON message format with channels
- More flexible than HTML-only partials
- Supports multiple channels (UI, custom)
- Enables structured metadata (target, swap, etc.)

🔄 **Event-Driven**: Rich event model for application integration
- Before/after hooks for all operations
- Custom message handling via events
- Better observability and debugging

🔄 **Configuration**: Global config object for behavior tuning
- Reconnection strategies
- Auto-connect control
- Background behavior

## Example Use Cases

### Live Chat
```html
<div hx-ws:connect="ws://localhost:8080/chat" 
     hx-trigger="load" 
     hx-target="#messages" 
     hx-swap="beforeend">
    <div id="messages"></div>
    <form hx-ws:send hx-trigger="submit">
        <input type="text" name="message">
        <button>Send</button>
    </form>
</div>
```

### Real-Time Notifications
```html
<div hx-ws:connect="ws://localhost:8080/notifications" 
     hx-trigger="load"
     hx-target="#notifications"
     hx-swap="afterbegin">
    <div id="notifications"></div>
</div>
```

### Interactive Controls
```html
<div hx-ws:connect="ws://localhost:8080/counter" hx-trigger="load">
    <div id="counter">0</div>
    <button hx-ws:send hx-vals='{"action":"increment"}'>+</button>
    <button hx-ws:send hx-vals='{"action":"decrement"}'>-</button>
</div>
```

## Testing

See `test/manual/ws.html` for a comprehensive manual test suite demonstrating:
- Live chat with message history
- Real-time notifications
- Shared counter with multiple controls
- Live stock ticker
- System dashboard with metrics
- Event logging

Run the test server: `node test/manual/ws-server.js`

## Future Considerations

- **Binary Messages**: Support for binary WebSocket frames
- **Compression**: Per-message deflate extension support
- **Authentication**: Token refresh and re-auth patterns
- **Multiplexing**: Virtual channels over single connection
- **Backpressure**: Client-side message queuing and flow control

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
    "headers": { /* request headers */ },
    "values": { /* form data or hx-vals */ },
    "request_id": "unique-id"  // for response matching
}
```

## Message Format

### Server → Client (JSON Envelope)

Messages from the server should be JSON objects with this structure:

```json
{
    "channel": "ui",           // Channel identifier
    "format": "html",          // Message format
    "target": "#element-id",   // Optional: specific target selector
    "swap": "innerHTML",       // Optional: swap strategy
    "payload": "<div>...</div>", // The actual content
    "request_id": "unique-id"  // Optional: matches original request
}
```

**Standard Channels:**
- **`ui`**: UI updates (HTML content swapping)
  - `format: "html"`: Swap HTML content into target element
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
    reconnectDelay: 1000,        // Initial delay in ms (default: 1000)
    reconnectMaxDelay: 30000,    // Max delay in ms (default: 30000)
    reconnectJitter: true,       // Add jitter to reconnect delays (default: true)
    autoConnect: false,          // Auto-connect on page load (default: false)
    pauseInBackground: true      // Pause reconnection when page hidden (default: true)
};
```

**Reconnection Strategy:**
- Exponential backoff: `delay = min(reconnectDelay * 2^attempts, reconnectMaxDelay)`
- Jitter reduces delay by up to 25% to avoid thundering herd
- Respects page visibility API to pause reconnection in background tabs

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
- `detail`: `{ url, code, reason }`

**`htmx:ws:error`**
- Triggered on connection error
- `detail`: `{ url, error }`

### Message Events

**`htmx:before:ws:send`**
- Triggered before sending a message
- `detail`: `{ data, element }`
- Cancellable via `preventDefault()`

**`htmx:after:ws:send`**
- Triggered after message is sent
- `detail`: `{ data, element }`

**`htmx:wsSendError`**
- Triggered when send fails (e.g., no connection URL found)
- `detail`: `{ element }`

**`htmx:wsMessage`**
- Triggered for custom channel messages
- `detail`: `{ channel, format, payload, ... }`

**`htmx:wsUnknownMessage`**
- Triggered for non-JSON messages
- `detail`: `{ data }` (raw message data)

## Implementation Details

### HTML Swapping

When a `channel: "ui"` message arrives:
1. Determine target element (from message `target`, request context, or default `hx-target`)
2. Determine swap strategy (from message `swap`, or default `hx-swap`, or `innerHTML`)
3. Use htmx's swap mechanisms to update the DOM
4. Automatically processes swapped content with `htmx.process()`

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

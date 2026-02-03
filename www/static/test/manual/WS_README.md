# HTMX WebSocket Extension - Interactive Demo

A beautiful, comprehensive demonstration of the `hx-ws` extension showcasing real-time bidirectional communication with WebSockets.

## 🚀 Quick Start

1. **Install dependencies** (if you haven't already):
   ```bash
   npm install ws
   ```

2. **Start the WebSocket server**:
   ```bash
   node test/manual/ws-server.js
   ```

3. **Open your browser**:
   Navigate to `http://localhost:8080`

## 🎯 What's Included

### 1. **Live Chat**
- Send and receive messages in real-time
- See your messages and bot responses instantly
- Demonstrates `hx-ws:send` with form submission

### 2. **Live Notifications**
- Receive random notifications every 5-8 seconds
- Shows real-time server push
- Uses `beforeend` swap to prepend new notifications

### 3. **Shared Counter**
- Multiple clients share the same counter state
- Increment, decrement, or reset from any client
- All connected clients see updates instantly
- Demonstrates bi-directional communication

### 4. **Stock Ticker**
- Live updating stock prices
- Prices change every 2-3 seconds
- Shows percentage changes with color coding
- Demonstrates continuous server streaming

### 5. **System Dashboard**
- Real-time system metrics (CPU, Memory, Disk)
- Multiple partial updates in a single message
- Updates every second
- Shows using multiple `<hx-partial>` elements

### 6. **Event Log**
- See all WebSocket events in real-time
- Connection, disconnection, messages, errors
- Demonstrates event listeners for debugging

## 💡 Features Demonstrated

- **Connection Management**: `hx-ws:connect` with different URLs
- **Message Sending**: `hx-ws:send` with forms and buttons
- **Partial Updates**: Using `<hx-partial>` elements for targeted swaps
- **Multiple Connections**: Each demo card maintains its own WebSocket
- **Event Handling**: Custom event listeners for debugging
- **Reconnection**: Automatic reconnection on disconnect (try stopping the server!)
- **Swap Strategies**: Different `hx-swap` values (innerHTML, beforeend, etc.)

## 🎨 Key Concepts

### HTML Partial Format

Server messages use this format:

```json
{
  "channel": "ui",
  "format": "html",
  "payload": "<hx-partial id=\"target-id\">Content</hx-partial>"
}
```

### Request/Response Pattern

Client sends:
```json
{
  "type": "request",
  "request_id": "uuid-here",
  "values": {
    "message": "Hello!"
  }
}
```

Server responds with matching `request_id` to target the originating element.

### Multiple Partials

Send multiple updates in one message:

```html
<hx-partial id="cpu">CPU: 45%</hx-partial>
<hx-partial id="memory">Memory: 62%</hx-partial>
<hx-partial id="disk">Disk: 73%</hx-partial>
```

## 🔧 Configuration

The extension respects these config options:

```javascript
htmx.config.websockets = {
    reconnect: true,              // Auto-reconnect on disconnect
    reconnectDelay: 1000,         // Initial delay (ms)
    reconnectMaxDelay: 30000,     // Max delay (ms)
    reconnectJitter: true,        // Add randomness to delays
    autoConnect: false,           // Connect without hx-trigger
    closeOnHide: true              // Close stream when tab is hidden
};
```

## 🎓 Learning Points

1. **Connection Pooling**: Multiple elements can share the same WebSocket connection
2. **Bi-directional**: Both client and server can initiate messages
3. **Event-Driven**: Rich event system for monitoring and debugging
4. **Swap Strategies**: Flexible content replacement strategies
5. **Graceful Degradation**: Automatic reconnection and error handling

## 📚 Code Examples

### Basic Connection
```html
<div hx-ws:connect="ws://localhost:8080/chat" hx-trigger="load">
    <div id="messages"></div>
</div>
```

### Sending Messages
```html
<form hx-ws:send hx-trigger="submit">
    <input name="message" type="text">
    <button type="submit">Send</button>
</form>
```

### Button Actions
```html
<button hx-ws:send='{"action":"increment"}' hx-trigger="click">
    Increment
</button>
```

### Multiple Targets
```html
<div hx-ws:connect="ws://localhost:8080/dashboard" hx-trigger="load">
    <div id="cpu"></div>
    <div id="memory"></div>
    <div id="disk"></div>
</div>
```

## 🐛 Debugging

The demo includes a live event log that shows:
- Connection events (`htmx:before:ws:connect`, `htmx:after:ws:connect`)
- Message events (`htmx:before:ws:send`, `htmx:after:ws:message`)
- Error events (`htmx:ws:error`, `htmx:ws:close`)
- Reconnection attempts (`htmx:ws:reconnect`)

## 🤝 Contributing

Try modifying the demos to learn:
- Change swap strategies (`hx-swap="beforeend"`)
- Add new message types
- Implement custom channels
- Add authentication
- Create new demo cards

## 📖 Documentation

For full documentation, visit:
- [HTMX WebSocket Extension Docs](https://htmx.org/extensions/websockets/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 🎉 Have Fun!

Open multiple browser windows to see real-time synchronization in action. The shared counter and chat work across all connected clients!


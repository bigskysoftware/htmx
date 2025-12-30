+++
title = "htmx WebSocket Extension"
+++

The WebSocket extension enables real-time, bidirectional communication with
[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
servers directly from HTML. It manages connections efficiently through reference counting, automatic reconnection,
and seamless integration with htmx's swap and event model.

## Installing

The fastest way to install the WebSocket extension is to load it via a CDN. Include the core htmx library before the extension:

```html
<head>
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@4/dist/htmx.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@4/dist/ext/hx-ws.min.js"></script>
</head>
```

The extension is automatically active once loaded—no `hx-ext` attribute required.

For npm-style build systems:
```bash
npm install htmx.org
```

Then import in your JavaScript:
```javascript
import 'htmx.org';
import 'htmx.org/dist/ext/hx-ws.js';
```

## Usage

Use these attributes to configure WebSocket behavior:

| Attribute | Description |
|-----------|-------------|
| `hx-ws:connect="<url>"` | Establishes a WebSocket connection to the specified URL |
| `hx-ws:send` | Sends form data or `hx-vals` to the WebSocket on trigger |
| `hx-ws:send="<url>"` | Like `hx-ws:send` but creates its own connection to the URL |

**JSX-Compatible Variants:** For frameworks that don't support colons in attribute names, use hyphen variants: `hx-ws-connect` and `hx-ws-send`.

### Basic Example

```html
<div hx-ws:connect="/chatroom" hx-target="#messages" hx-swap="beforeend">
    <div id="messages"></div>
    <form hx-ws:send>
        <input name="message" placeholder="Type a message...">
        <button type="submit">Send</button>
    </form>
</div>
```

This example:
1. Establishes a WebSocket connection to `/chatroom` when the page loads
2. Appends incoming HTML messages to `#messages`
3. Sends form data as JSON when the form is submitted

## URL Normalization

WebSocket URLs are automatically normalized:

| Input | Output (on HTTPS page) |
|-------|------------------------|
| `/ws/chat` | `wss://example.com/ws/chat` |
| `ws://localhost:8080/ws` | `ws://localhost:8080/ws` |
| `https://api.example.com/ws` | `wss://api.example.com/ws` |
| `//cdn.example.com/ws` | `wss://cdn.example.com/ws` |

This means you can use simple relative paths in most cases, and the extension will construct the correct WebSocket URL.

## Receiving Messages

### JSON Envelope Format

Messages from the server should be JSON objects:

```json
{
    "channel": "ui",
    "format": "html",
    "target": "#notifications",
    "swap": "beforeend",
    "payload": "<div class='notification'>New message!</div>",
    "request_id": "abc-123"
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `channel` | `"ui"` | Message routing channel |
| `format` | `"html"` | Content format |
| `target` | Element's `hx-target` | CSS selector for target element |
| `swap` | Element's `hx-swap` | Swap strategy (innerHTML, beforeend, etc.) |
| `payload` | — | The content to swap |
| `request_id` | — | Matches response to original request |

**Minimal Example** (using all defaults):
```json
{"payload": "<div>Hello World</div>"}
```

### Channels

- **`ui` channel** (default): HTML content is swapped into the target element using htmx's swap pipeline
- **Custom channels**: Emit an `htmx:wsMessage` event for application handling

```javascript
// Handle custom channel messages
document.addEventListener('htmx:wsMessage', (e) => {
    if (e.detail.channel === 'notifications') {
        showNotification(e.detail.payload);
    }
});
```

### Request-Response Matching

The extension generates a unique `request_id` for each message sent. When the server includes this `request_id` in the response:

- Content is swapped into the element that originated the request
- That element's `hx-target` and `hx-swap` attributes are respected
- Enables request-response patterns over WebSocket

### Legacy Format (Deprecated)

For backward compatibility, the extension also supports `<hx-partial>` elements:

```html
<hx-partial id="notifications">
    <div>New notification</div>
</hx-partial>
```

## Sending Messages

When an element with `hx-ws:send` is triggered, the extension sends a JSON message:

```json
{
    "type": "request",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "event": "submit",
    "headers": {
        "HX-Request": "true",
        "HX-Current-URL": "https://example.com/chat",
        "HX-Trigger": "chat-form",
        "HX-Target": "#messages"
    },
    "values": {
        "message": "Hello!",
        "tags": ["urgent", "public"]
    },
    "path": "wss://example.com/chatroom",
    "id": "chat-form"
}
```

| Field | Description |
|-------|-------------|
| `type` | Always `"request"` for client-to-server messages |
| `request_id` | Unique ID for request/response matching |
| `event` | DOM event type that triggered the send (e.g., `"submit"`, `"click"`) |
| `headers` | HTMX-style headers for server-side routing |
| `values` | Form data and `hx-vals` (multi-value fields preserved as arrays) |
| `path` | The normalized WebSocket URL |
| `id` | Element ID (only present if element has an `id`) |

### Forms

```html
<form hx-ws:send>
    <input name="username">
    <input name="message">
    <button type="submit">Send</button>
</form>
```

Form data is collected and sent as the `values` object. Multi-value fields (like checkboxes or multi-selects) are preserved as arrays.

### Buttons with hx-vals

```html
<button hx-ws:send hx-vals='{"action": "increment"}'>+1</button>
```

### Modifying Messages Before Send

Use the `htmx:before:ws:send` event to modify or cancel messages:

```javascript
document.addEventListener('htmx:before:ws:send', (e) => {
    // Add authentication token
    e.detail.data.headers['Authorization'] = 'Bearer ' + getToken();
    
    // Or cancel the send
    if (!isValid(e.detail.data)) {
        e.preventDefault();
    }
});
```

## Configuration

Configure the extension via `htmx.config.websockets`:

```javascript
htmx.config.websockets = {
    reconnect: true,           // Enable auto-reconnect (default: true)
    reconnectDelay: 1000,      // Initial reconnect delay in ms (default: 1000)
    reconnectMaxDelay: 30000,  // Maximum reconnect delay in ms (default: 30000)
    reconnectJitter: true,     // Add randomization to delays (default: true)
    pendingRequestTTL: 30000   // Time-to-live for pending requests in ms (default: 30000)
};
```

### Reconnection Strategy

The extension uses exponential backoff with optional jitter:

- **Base formula**: `delay = min(reconnectDelay × 2^(attempts-1), reconnectMaxDelay)`
- **Jitter**: Adds ±25% randomization to avoid thundering herd
- **Reset**: Attempts counter resets to 0 on successful connection

Example reconnection delays with defaults:
- Attempt 1: ~1000ms
- Attempt 2: ~2000ms
- Attempt 3: ~4000ms
- Attempt 4: ~8000ms
- Attempt 5+: ~30000ms (capped)

### Connection Triggers

By default, connections are established immediately when the element is processed:

```html
<!-- Connects immediately when element appears (default) -->
<div hx-ws:connect="/ws">

<!-- Explicit load trigger - same behavior as no trigger -->
<div hx-ws:connect="/ws" hx-trigger="load">

<!-- Deferred connection - only connects when button is clicked -->
<div hx-ws:connect="/ws" hx-trigger="click from:#connect-btn">
```

Use `hx-trigger` when you want to **delay** connection establishment (e.g., wait for user action).

**Note:** Only bare event names are supported for connection triggers. Modifiers like `delay`, `throttle`, `once` are **not supported**. For complex connection logic, use the `htmx:before:ws:connect` event.

## Events

### Connection Lifecycle

| Event | Cancelable | Detail | Description |
|-------|------------|--------|-------------|
| `htmx:before:ws:connect` | ✅ | `{url}` | Before establishing connection |
| `htmx:after:ws:connect` | ❌ | `{url, socket}` | After successful connection |
| `htmx:ws:close` | ❌ | `{url, code, reason}` | When connection closes |
| `htmx:ws:error` | ❌ | `{url, error}` | On connection error |
| `htmx:ws:reconnect` | ❌ | `{url, attempts}` | Before reconnection attempt |

### Message Events

| Event | Cancelable | Detail | Description |
|-------|------------|--------|-------------|
| `htmx:before:ws:send` | ✅ | `{data, element, url}` | Before sending (data is modifiable) |
| `htmx:after:ws:send` | ❌ | `{data, url}` | After message sent |
| `htmx:wsSendError` | ❌ | `{element, error}` | When send fails |
| `htmx:before:ws:message` | ✅ | `{envelope, element}` | Before processing received message |
| `htmx:after:ws:message` | ❌ | `{envelope, element}` | After processing received message |
| `htmx:wsMessage` | ❌ | `{channel, format, payload, ...}` | For non-UI channel messages |
| `htmx:wsUnknownMessage` | ❌ | `{data, parseError}` | For non-JSON messages |

### Event Examples

**Cancel Connection Based on Condition:**
```javascript
document.addEventListener('htmx:before:ws:connect', (e) => {
    if (document.hidden) {
        e.preventDefault(); // Don't connect in background tab
    }
});
```

**Handle Custom Messages:**
```javascript
document.addEventListener('htmx:wsMessage', (e) => {
    if (e.detail.channel === 'audio') {
        playAudioNotification(e.detail.payload);
    }
});
```

**Log All WebSocket Activity:**
```javascript
document.addEventListener('htmx:after:ws:connect', (e) => {
    console.log('Connected to', e.detail.url);
});
document.addEventListener('htmx:ws:close', (e) => {
    console.log('Disconnected from', e.detail.url, 'code:', e.detail.code);
});
```

## Connection Management

### Reference Counting

Multiple elements can share a single WebSocket connection:

```html
<div hx-ws:connect="/notifications" id="notif-1">
    <!-- Uses connection to /notifications -->
</div>
<div hx-ws:connect="/notifications" id="notif-2">
    <!-- Shares the same connection -->
</div>
```

When all elements using a connection are removed from the DOM, the connection is automatically closed.

### Element Cleanup

When elements are removed (e.g., via htmx swap), the extension:
1. Decrements the reference count for the connection
2. Removes event listeners from the element
3. Closes the WebSocket if no elements remain

This happens automatically through htmx's element cleanup lifecycle.

## HTML Swapping

When a `channel: "ui"` message arrives, the extension uses htmx's internal `insertContent` API, which provides:

- All swap styles (`innerHTML`, `outerHTML`, `beforebegin`, `afterend`, `beforeend`, `afterbegin`, `delete`, `none`)
- Preserved elements (`hx-preserve`)
- Auto-focus handling
- Scroll handling  
- Proper cleanup of removed elements
- `htmx.process()` called on newly inserted content

### Target Resolution

Target is determined in this order:
1. `target` field in the message envelope
2. `hx-target` attribute on the element that sent the request (if `request_id` matches)
3. `hx-target` attribute on the connection element
4. The connection element itself

### Swap Strategy

Swap strategy is determined in this order:
1. `swap` field in the message envelope
2. `hx-swap` attribute on the target element
3. `htmx.config.defaultSwap` (default: `innerHTML`)

## Examples

### Live Chat

```html
<div hx-ws:connect="/chat">
    <div id="messages" hx-target="this" hx-swap="beforeend"></div>
    <form hx-ws:send>
        <input name="message" placeholder="Message..." autocomplete="off">
        <button type="submit">Send</button>
    </form>
</div>
```

Server sends:
```json
{"payload": "<div class='message'><b>User:</b> Hello!</div>"}
```

### Real-Time Notifications

```html
<div hx-ws:connect="/notifications"
     hx-target="#notification-list"
     hx-swap="afterbegin">
    <div id="notification-list"></div>
</div>
```

### Interactive Counter

```html
<div hx-ws:connect="/counter">
    <div id="count" hx-target="this">0</div>
    <button hx-ws:send hx-vals='{"action":"increment"}'>+</button>
    <button hx-ws:send hx-vals='{"action":"decrement"}'>-</button>
</div>
```

### Multiple Widgets Sharing Connection

```html
<div hx-ws:connect="/dashboard">
    <div id="cpu-usage">--</div>
    <div id="memory-usage">--</div>
    <div id="disk-usage">--</div>
</div>
```

Server sends targeted updates:
```json
{"target": "#cpu-usage", "payload": "<span>45%</span>"}
{"target": "#memory-usage", "payload": "<span>2.3 GB</span>"}
```

## Migrating from Previous Versions

### Attribute Changes

| Old (htmx 2.x) | New (htmx 4.x) | Notes |
|----------------|----------------|-------|
| `ws-connect="<url>"` | `hx-ws:connect="<url>"` | Or `hx-ws-connect` for JSX |
| `ws-send` | `hx-ws:send` | Or `hx-ws-send` for JSX |
| `hx-ext="ws"` | Not required | Extension auto-registers when loaded |

The old `ws-connect` and `ws-send` attributes still work but emit a deprecation warning.

### Event Changes

| Old Event | New Event | Notes |
|-----------|-----------|-------|
| `htmx:wsConnecting` | — | Removed |
| `htmx:wsOpen` | `htmx:after:ws:connect` | Different detail structure |
| `htmx:wsClose` | `htmx:ws:close` | Now includes `code` and `reason` |
| `htmx:wsError` | `htmx:ws:error` | Similar |
| `htmx:wsBeforeMessage` | `htmx:before:ws:message` | Different detail structure |
| `htmx:wsAfterMessage` | `htmx:after:ws:message` | Different detail structure |
| `htmx:wsConfigSend` | `htmx:before:ws:send` | Modify `e.detail.data` instead |
| `htmx:wsBeforeSend` | `htmx:before:ws:send` | Combined into one event |
| `htmx:wsAfterSend` | `htmx:after:ws:send` | Similar |

### Configuration Changes

| Old | New |
|-----|-----|
| `htmx.config.wsReconnectDelay` | `htmx.config.websockets.reconnectDelay` |
| `createWebSocket` option | Not supported (use events) |
| `wsBinaryType` option | Not supported |

### Message Format Changes

**Send payload** now includes `type`, `request_id`, `event`, and structured `headers` object instead of `HEADERS` string.

**Receive format** now expects JSON envelope with `channel`, `format`, `target`, `swap`, `payload` fields instead of raw HTML or `hx-swap-oob`.

### Socket Wrapper Removed

The `socketWrapper` object is no longer exposed in events. Use the standard WebSocket events and the extension's event system instead.

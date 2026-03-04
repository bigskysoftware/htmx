---
title: "htmx.config.sse"
description: "Server-Sent Events configuration"
---

# **`htmx.config.sse`**

Configuration object for Server-Sent Events (SSE) behavior.

**Default:**
```javascript
{
  reconnect: false,
  reconnectDelay: 500,
  reconnectMaxDelay: 60000,
  reconnectMaxAttempts: 10,
  reconnectJitter: 0.3,
  pauseInBackground: false
}
```

## Properties

- `reconnect` - Auto-reconnect on disconnect
- `reconnectDelay` - Initial delay in ms before reconnecting
- `reconnectMaxDelay` - Maximum delay in ms (uses exponential backoff)
- `reconnectMaxAttempts` - Maximum reconnection attempts
- `reconnectJitter` - Jitter factor (0-1) to randomize reconnect timing
- `pauseInBackground` - Pause SSE streams when tab is not visible

## Example

```javascript
htmx.config.sse.reconnect = true;
htmx.config.sse.reconnectDelay = 1000;
```

```html
<meta name="htmx-config" content='{"sse":{"reconnect":true,"reconnectDelay":1000}}'>
```

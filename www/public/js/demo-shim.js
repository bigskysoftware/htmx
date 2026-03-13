// www/public/js/demo-shim.js
// Page-side shim for htmx pattern demos.
// Provides the server.* API, registers the Service Worker,
// handles route matching, and mocks WebSocket connections.

(function() {
  'use strict';

  const routes = [];
  const sseHandlers = [];
  const wsHandlers = [];
  let responseDelay = 0;
  let swReady = null;
  let sseConnectionId = 0;
  const activeSseStreams = new Map();

  // --- Route matching ---

  function matchRoute(method, url) {
    const urlObj = new URL(url, location.origin);
    const path = urlObj.pathname;

    for (const route of routes) {
      if (route.method !== method) continue;
      if (route.url instanceof RegExp) {
        if (route.url.test(path) || route.url.test(url)) return route;
      } else if (route.url === path) {
        return route;
      }
    }
    return null;
  }

  function matchSseHandler(url) {
    const path = new URL(url, location.origin).pathname;
    for (const h of sseHandlers) {
      if (h.path instanceof RegExp ? h.path.test(path) : h.path === path) return h;
    }
    return null;
  }

  function matchWsHandler(url) {
    for (const h of wsHandlers) {
      if (h.path instanceof RegExp ? h.path.test(url) : url.includes(h.path)) return h;
    }
    return null;
  }

  // --- Request parsing ---

  function parseParams(url, body) {
    const params = {};
    const urlObj = new URL(url, location.origin);
    for (const [k, v] of urlObj.searchParams) params[k] = v;
    if (body) {
      try {
        const bodyParams = new URLSearchParams(body);
        for (const [k, v] of bodyParams) params[k] = v;
      } catch (e) { /* not form-encoded, ignore */ }
    }
    return params;
  }

  // --- SW message handling ---

  function handleSwMessage(event) {
    if (event.data.type !== 'demo-request') return;

    const { url, method, body, headers } = event.data;
    const port = event.ports[0];
    if (!port) return;

    // Check SSE handlers first (GET requests with SSE handler registered)
    if (method === 'GET') {
      const sseHandler = matchSseHandler(url);
      if (sseHandler) {
        const connId = ++sseConnectionId;
        port.postMessage({ type: 'sse-start', connectionId: connId });

        // Create stream object for the handler
        const stream = {
          onclose: null,
          send({ event: eventType, data }) {
            navigator.serviceWorker.controller.postMessage({
              type: 'sse-data',
              connectionId: connId,
              eventType: eventType || null,
              data: typeof data === 'object' ? JSON.stringify(data) : String(data),
            });
          },
          close() {
            navigator.serviceWorker.controller.postMessage({
              type: 'sse-end',
              connectionId: connId,
            });
            activeSseStreams.delete(connId);
          }
        };
        activeSseStreams.set(connId, stream);
        sseHandler.handler(stream);
        return;
      }
    }

    // Check HTTP routes
    const route = matchRoute(method, url);
    if (!route) {
      port.postMessage({ type: 'no-match' });
      return;
    }

    const req = {
      url,
      method,
      params: parseParams(url, body),
      body: body,  // raw body string, for patterns that need it (e.g. file-upload)
      headers: headers || {},
    };

    try {
      const result = route.handler(req);
      if (typeof result === 'string') {
        port.postMessage({ body: result, status: 200, headers: {}, delay: responseDelay });
      } else if (result && typeof result === 'object') {
        port.postMessage({
          body: result.body || '',
          status: result.status || 200,
          headers: result.headers || {},
          delay: responseDelay,
        });
      }
    } catch (err) {
      console.error('[demo] Route handler error:', err);
      port.postMessage({ body: `<pre>Error: ${err.message}</pre>`, status: 500, headers: {} });
    }
  }

  // Listen for SSE close notifications from SW
  function handleSseClose(event) {
    if (event.data.type === 'sse-close') {
      const stream = activeSseStreams.get(event.data.connectionId);
      if (stream) {
        if (stream.onclose) stream.onclose();
        activeSseStreams.delete(event.data.connectionId);
      }
    }
  }

  // --- WebSocket mock ---

  const OriginalWebSocket = window.WebSocket;

  function MockWebSocket(url, protocols) {
    const handler = matchWsHandler(url);
    if (!handler) return new OriginalWebSocket(url, protocols);

    const ws = Object.create(MockWebSocket.prototype);
    ws.url = url;
    ws.readyState = 0; // CONNECTING
    ws.protocol = '';
    ws.extensions = '';
    ws.bufferedAmount = 0;
    ws.binaryType = 'blob';

    // Event handlers
    ws.onopen = null;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    const listeners = {};

    ws.addEventListener = (type, fn) => {
      (listeners[type] = listeners[type] || []).push(fn);
    };
    ws.removeEventListener = (type, fn) => {
      if (listeners[type]) listeners[type] = listeners[type].filter(f => f !== fn);
    };
    ws.dispatchEvent = (event) => {
      const handler = ws['on' + event.type];
      if (handler) handler.call(ws, event);
      (listeners[event.type] || []).forEach(fn => fn.call(ws, event));
    };

    // Server-side socket interface
    const serverSocket = {
      onmessage: null,
      send(data) {
        const label = typeof data === 'object' ? JSON.stringify(data) : String(data);
        console.log('%c[demo-ws] %c↙ server → ' + new URL(url).pathname + ': %c' + label,
          'color:#8b5cf6;font-weight:bold', 'color:#6ee7b7', 'color:inherit');
        setTimeout(() => {
          ws.dispatchEvent(new MessageEvent('message', { data }));
        }, 0);
      },
      close(code = 1000, reason = '') {
        console.log('%c[demo-ws] %c✕ closed ' + new URL(url).pathname,
          'color:#8b5cf6;font-weight:bold', 'color:#f87171');
        ws.readyState = 3;
        ws.dispatchEvent(new CloseEvent('close', { code, reason, wasClean: true }));
      }
    };

    ws.send = (data) => {
      const label = typeof data === 'object' ? JSON.stringify(data) : String(data);
      console.log('%c[demo-ws] %c↗ client → ' + new URL(url).pathname + ': %c' + label,
        'color:#8b5cf6;font-weight:bold', 'color:#38bdf8', 'color:inherit');
      if (serverSocket.onmessage) serverSocket.onmessage(data);
    };

    ws.close = (code = 1000, reason = '') => {
      console.log('%c[demo-ws] %c✕ closed ' + new URL(url).pathname,
        'color:#8b5cf6;font-weight:bold', 'color:#f87171');
      ws.readyState = 3;
      ws.dispatchEvent(new CloseEvent('close', { code, reason, wasClean: true }));
    };

    // Open connection asynchronously
    setTimeout(() => {
      ws.readyState = 1; // OPEN
      console.log('%c[demo-ws] %c⚡ connected ' + new URL(url).pathname,
        'color:#8b5cf6;font-weight:bold', 'color:#4ade80');
      ws.dispatchEvent(new Event('open'));
      handler.handler(serverSocket);
    }, 0);

    return ws;
  }
  MockWebSocket.CONNECTING = 0;
  MockWebSocket.OPEN = 1;
  MockWebSocket.CLOSING = 2;
  MockWebSocket.CLOSED = 3;
  MockWebSocket.prototype = Object.create(OriginalWebSocket.prototype);

  // --- The server API ---

  function registerRoute(method, path, handler) {
    routes.push({ method, url: path, handler });
  }

  window.server = {
    get:    (path, handler) => registerRoute('GET', path, handler),
    post:   (path, handler) => registerRoute('POST', path, handler),
    put:    (path, handler) => registerRoute('PUT', path, handler),
    delete: (path, handler) => registerRoute('DELETE', path, handler),

    delay: (ms) => { responseDelay = ms; },

    sse: (path, handler) => { sseHandlers.push({ path, handler }); },
    ws:  (path, handler) => { wsHandlers.push({ path, handler }); },

    start: async (path) => {
      // Ensure SW is ready
      await swReady;

      // Patch WebSocket if we have WS handlers
      if (wsHandlers.length > 0) window.WebSocket = MockWebSocket;

      // Inject htmx load trigger into #demo-content
      const el = document.getElementById('demo-content');
      if (!el) {
        console.error('[demo] #demo-content element not found');
        return;
      }
      el.style.removeProperty('display');
      el.closest('[data-demo-container]')?.style.removeProperty('display');
      el.innerHTML = `<div hx-get="${path}" hx-trigger="load" hx-swap="outerHTML transition:false"></div>`;
      if (window.htmx) htmx.process(el);
    },
  };

  // --- SW registration ---

  if ('serviceWorker' in navigator) {
    swReady = navigator.serviceWorker.register('/js/demo-sw.js', { scope: '/' })
      .then(() => navigator.serviceWorker.ready);

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    navigator.serviceWorker.addEventListener('message', handleSseClose);
  } else {
    console.warn('[demo] Service Workers not supported — demos will not work');
    swReady = Promise.resolve();
  }
})();

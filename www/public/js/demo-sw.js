// www/public/js/demo-sw.js
// Service Worker for htmx pattern demos.
// Intercepts fetch requests and relays them to the page via MessageChannel.
// Supports HTTP and SSE (Server-Sent Events via ReadableStream).

const FALLTHROUGH_TIMEOUT = 300; // ms before falling through to real network

// SSE stream controllers, keyed by connection ID
const sseControllers = new Map();
let sseConnectionId = 0;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  // Only intercept same-origin requests
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // Skip requests for static assets, Astro dev server, etc.
  const path = new URL(event.request.url).pathname;
  if (path.startsWith('/js/') || path.startsWith('/img/') || path.startsWith('/src/') ||
      path.startsWith('/@') || path.startsWith('/node_modules/') ||
      path.endsWith('.astro') || path.endsWith('.css') || path.endsWith('.svg') ||
      path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.ico') ||
      path.endsWith('.woff2') || path.endsWith('.woff') ||
      path === '/' || path.startsWith('/patterns') || path.startsWith('/docs') ||
      path.startsWith('/reference') || path.startsWith('/essays') ||
      path.startsWith('/about') || path.startsWith('/search-index')) return;

  event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
  const client = await self.clients.get(event.clientId);
  if (!client) return fetch(event.request);

  const messageChannel = new MessageChannel();
  const requestBody = event.request.method !== 'GET'
    ? await event.request.text()
    : null;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(fetch(event.request));
    }, FALLTHROUGH_TIMEOUT);

    messageChannel.port1.onmessage = (msg) => {
      clearTimeout(timeout);

      if (msg.data.type === 'no-match') {
        resolve(fetch(event.request));
        return;
      }

      if (msg.data.type === 'sse-start') {
        // SSE: create a ReadableStream and return it immediately
        const connId = msg.data.connectionId;
        const stream = new ReadableStream({
          start(controller) {
            sseControllers.set(connId, controller);
          },
          cancel() {
            sseControllers.delete(connId);
            // Notify page that client disconnected
            client.postMessage({ type: 'sse-close', connectionId: connId });
          }
        });
        resolve(new Response(stream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }));
        return;
      }

      // Normal HTTP response
      const { body, status = 200, headers = {} } = msg.data;
      const delay = msg.data.delay || 0;
      setTimeout(() => {
        resolve(new Response(body, {
          status,
          headers: { 'Content-Type': 'text/html', ...headers }
        }));
      }, delay);
    };

    client.postMessage({
      type: 'demo-request',
      url: event.request.url,
      method: event.request.method,
      body: requestBody,
      headers: Object.fromEntries(event.request.headers.entries()),
    }, [messageChannel.port2]);
  });
}

// Listen for SSE data messages from the page
self.addEventListener('message', (event) => {
  if (event.data.type === 'sse-data') {
    const controller = sseControllers.get(event.data.connectionId);
    if (controller) {
      const { eventType, data } = event.data;
      let chunk = '';
      if (eventType) chunk += `event: ${eventType}\n`;
      chunk += `data: ${data}\n\n`;
      controller.enqueue(new TextEncoder().encode(chunk));
    }
  } else if (event.data.type === 'sse-end') {
    const controller = sseControllers.get(event.data.connectionId);
    if (controller) {
      controller.close();
      sseControllers.delete(event.data.connectionId);
    }
  }
});

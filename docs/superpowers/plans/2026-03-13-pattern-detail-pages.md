# Pattern Detail Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Service Worker-based demo system for htmx pattern pages, with a clean `server.*` authoring API, SSE/WS support, sidebar icons, and a demo-first page layout.

**Architecture:** A Service Worker intercepts HTTP/SSE requests from pattern demos and relays them to page-side route handlers via MessageChannel. WebSocket connections are mocked client-side. A global `server` object provides the authoring API. The Demo component is rendered by the layout automatically for pattern detail pages.

**Tech Stack:** Astro, Service Workers, MessageChannel, ReadableStream (SSE), vanilla JS

**Spec:** `docs/superpowers/specs/2026-03-13-pattern-detail-pages-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `www/public/js/demo-sw.js` | Service Worker — intercepts fetch, relays to page via MessageChannel, streams SSE via ReadableStream |
| `www/public/js/demo-shim.js` | Page-side shim — `server.*` API, route registry, SW registration, WS mock, console logging |
| `www/src/components/Demo.astro` | Demo container component — loads shim, provides `#demo-content` |
| `www/src/layouts/ContentLayout.astro` | Conditionally renders `<Demo />` for pattern detail pages |
| `www/src/components/Sidebar.astro` | Adds icon rendering for pattern links |
| `www/src/content.config.ts` | Adds `icon` field to patterns schema |
| `www/src/content/patterns/index.mdx` | Removes `iconMap`, reads icons from frontmatter |
| `www/src/content/patterns/**/*.md → *.mdx` | Migrated pattern files |

---

## Chunk 1: Service Worker and Shim (Core Demo System)

### Task 1: Create the Service Worker

**Files:**
- Create: `www/public/js/demo-sw.js`

- [ ] **Step 1: Write demo-sw.js**

```js
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
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la www/public/js/demo-sw.js`
Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add www/public/js/demo-sw.js
git commit -m "Add Service Worker for pattern demo interception"
```

---

### Task 2: Create the page-side shim

**Files:**
- Create: `www/public/js/demo-shim.js`

- [ ] **Step 1: Write demo-shim.js**

```js
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
```

- [ ] **Step 2: Verify file was created**

Run: `ls -la www/public/js/demo-shim.js`
Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add www/public/js/demo-shim.js
git commit -m "Add page-side shim with server.* API for pattern demos"
```

---

### Task 3: Update Demo.astro

**Files:**
- Modify: `www/src/components/Demo.astro` (full rewrite, 38 lines)

- [ ] **Step 1: Rewrite Demo.astro**

Replace the entire file with:

```astro
---
// Demo container for pattern pages.
// Loaded automatically by ContentLayout for pattern detail pages.
// Hidden by default; server.start() reveals it.
---

<script is:inline src="/js/demo-shim.js"></script>

<div data-demo-container class="not-prose my-8 max-w-4xl mx-auto" style="display:none">
    <div class="border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <!-- Window Header -->
        <div class="flex items-center gap-4 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800">
            <div class="flex gap-1.5">
                <div class="size-2 rounded-full bg-neutral-300 dark:bg-neutral-700/75"></div>
                <div class="size-2 rounded-full bg-neutral-300 dark:bg-neutral-700/75"></div>
                <div class="size-2 rounded-full bg-neutral-300 dark:bg-neutral-700/75"></div>
            </div>
            <span class="text-[0.675rem] font-medium text-neutral-500 dark:text-neutral-500/80 tracking-widest translate-y-px">
                DEMO
            </span>
        </div>
        <!-- Content -->
        <div class="p-6">
            <div id="demo-content">
                <!-- server.start() injects htmx load trigger here -->
            </div>
        </div>
    </div>
</div>
```

Key changes from current Demo.astro:
- Removes `fetch-mock.js` script reference
- Removes inline `<script>` with `init()`, `onGet()`, etc. (moved to shim)
- Removes `_hyperscript` dependency
- Loads `demo-shim.js` instead
- Adds `data-demo-container` attribute and `style="display:none"` — `server.start()` reveals it

- [ ] **Step 2: Verify the dev server still starts**

Run: `cd www && bun run dev` (check it starts without errors, then stop)

- [ ] **Step 3: Commit**

```bash
git add www/src/components/Demo.astro
git commit -m "Update Demo.astro to use demo-shim instead of fetch-mock"
```

---

### Task 4: Wire Demo into ContentLayout for pattern pages

**Files:**
- Modify: `www/src/layouts/ContentLayout.astro:2,26,162`

- [ ] **Step 1: Add Demo import**

At `www/src/layouts/ContentLayout.astro:2`, add the Demo import alongside existing imports:

```astro
import Demo from '../components/Demo.astro';
```

(Add after the existing `import Layout from './Layout.astro';` line)

- [ ] **Step 2: Add isPatterns computed variable**

At `www/src/layouts/ContentLayout.astro:29` (after the existing `const isEssay = ...` line), add:

```js
const isPatterns = !isIndex && collection === 'patterns';
```

- [ ] **Step 3: Render Demo in before-content slot**

At `www/src/layouts/ContentLayout.astro:162` (the `<slot name="before-content"/>` line), replace with:

```astro
{isPatterns && <Demo />}
<slot name="before-content"/>
```

- [ ] **Step 4: Verify dev server starts and pattern page loads**

Run: `cd www && bun run dev`
Navigate to `http://localhost:4321/patterns/loading/click-to-load`
Expected: Page loads without errors. Demo container is hidden (no `server.start()` called yet since the pattern file hasn't been migrated).

- [ ] **Step 5: Commit**

```bash
git add www/src/layouts/ContentLayout.astro
git commit -m "Render Demo component automatically on pattern detail pages"
```

---

## Chunk 2: Content Schema, Sidebar Icons, and Index Page

### Task 5: Add `icon` field to patterns content schema

**Files:**
- Modify: `www/src/content.config.ts:39-47`

- [ ] **Step 1: Add icon to patterns schema**

In `www/src/content.config.ts`, update the patterns collection schema (lines 41-46) to include `icon`:

```ts
schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    thumbnail: z.string().optional(),
    icon: z.string().optional(),
}).strict(),
```

- [ ] **Step 2: Verify dev server still starts**

Run: `cd www && bun run dev` (check no schema errors)

- [ ] **Step 3: Commit**

```bash
git add www/src/content.config.ts
git commit -m "Add icon field to patterns content schema"
```

---

### Task 6: Add icons to pattern sidebar links

**Files:**
- Modify: `www/src/components/Sidebar.astro:83-95`

- [ ] **Step 1: Update pattern link rendering**

In `www/src/components/Sidebar.astro`, replace lines 83-95 (the `<li>` block inside the files loop) with:

```astro
<li>
    <a href={file.url}
       title={file.frontmatter.description}
       aria-current={isActive ? 'page' : undefined}
       class:list={[
           "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition",
           isReference && "font-mono",
           isActive
               ? "bg-neutral-150 dark:bg-neutral-800 text-black dark:text-neutral-50 font-semibold"
               : "text-neutral-600 dark:text-neutral-400 interact:bg-neutral-100 dark:interact:bg-neutral-850 interact:text-black dark:interact:text-neutral-200"
       ]}>
        {isPatterns && file.frontmatter.icon && (
            <i class:list={[file.frontmatter.icon, "size-4 shrink-0"]}></i>
        )}
        <span class="truncate" set:html={file.frontmatter.title}/>
    </a>
</li>
```

Key changes:
- Link class changes from `block` to `flex items-center gap-2.5` (to align icon + text)
- Adds conditional `<i>` icon element before the title `<span>`
- `<span>` gets `truncate` class (was on `<a>` before via `truncate` in class list — now moved to span since `<a>` is flex)

- [ ] **Step 2: Verify sidebar renders correctly**

Run: `cd www && bun run dev`
Navigate to `http://localhost:4321/patterns/loading/click-to-load`
Expected: Sidebar shows pattern links without icons (no `icon` frontmatter yet). Layout is not broken.

- [ ] **Step 3: Commit**

```bash
git add www/src/components/Sidebar.astro
git commit -m "Add icon rendering to pattern sidebar links"
```

---

### Task 7: Update patterns index to read icons from frontmatter

**Files:**
- Modify: `www/src/content/patterns/index.mdx:22-45,56`

- [ ] **Step 1: Remove iconMap and update icon resolution**

In `www/src/content/patterns/index.mdx`:

1. Delete lines 22-45 (the entire `export const iconMap = { ... };` block)
2. Update the `icon` property in the `groupedPatterns` mapping (line 56 after deletion) from:
   ```js
   icon: iconMap[cleanSlug(e.id).split('/').pop()] || '',
   ```
   to:
   ```js
   icon: e.data.icon || '',
   ```

The full `groupedPatterns` export should now read:

```js
export const groupedPatterns = categoryEntries.map(cat => ({
    slug: cleanSlug(cat.id),
    label: cat.data.title,
    items: patternEntries
        .filter(e => e.id.startsWith(cat.id + '/'))
        .map(e => ({
            title: e.data.title,
            url: `/patterns/${cleanSlug(e.id)}`,
            description: e.data.description,
            icon: e.data.icon || '',
        })),
}));
```

- [ ] **Step 2: Verify index page loads**

Run: `cd www && bun run dev`
Navigate to `http://localhost:4321/patterns`
Expected: Page loads. Icons will be missing (no frontmatter yet) but layout is intact.

- [ ] **Step 3: Commit**

```bash
git add www/src/content/patterns/index.mdx
git commit -m "Read pattern icons from frontmatter instead of iconMap"
```

---

## Chunk 3: Migrate Pattern Files

### Task 8: Migrate click-to-load (proof of concept)

**Files:**
- Rename: `www/src/content/patterns/01-loading/01-click-to-load.md` → `01-click-to-load.mdx`
- (rename by creating new file with correct content, then deleting old)

This is the proof-of-concept migration. Get this one working end-to-end before migrating the rest.

- [ ] **Step 1: Create the migrated .mdx file**

Create `www/src/content/patterns/01-loading/01-click-to-load.mdx` with:

```mdx
---
title: "Click to Load"
description: Load content when you click an element
icon: "icon-[mdi--cursor-pointer]"
---

<script>
// Fake server-side data
var dataStore = function(){
  var contactId = 9;
  function generateContact() {
    contactId++;
    var idHash = "";
    var possible = "ABCDEFG0123456789";
    for( var i=0; i < 15; i++ ) idHash += possible.charAt(Math.floor(Math.random() * possible.length));
    return { name: "Agent Smith", email: "void" + contactId + "@null.org", id: idHash }
  }
  return {
    contactsForPage : function(page) {
      var vals = [];
      for( var i=0; i < 10; i++ ){
        vals.push(generateContact());
      }
      return vals;
    }
  }
}()

server.get("/demo", function(req) {
  var contacts = dataStore.contactsForPage(1);
  return tableTemplate(contacts);
});

server.get(/\/agents.*/, function(req) {
  var page = parseInt(req.params['page']);
  var contacts = dataStore.contactsForPage(page);
  return rowsTemplate(page, contacts);
});

function tableTemplate(contacts) {
    return `<table><thead><tr><th>Name</th><th>Email</th><th>ID</th></tr></thead><tbody>
            ${rowsTemplate(1, contacts)}
            </tbody></table>`
}

function rowsTemplate(page, contacts) {
  var txt = "";
  for (var i = 0; i < contacts.length; i++) {
    var c = contacts[i];
    txt += `<tr><td>${c.name}</td><td>${c.email}</td><td>${c.id}</td></tr>\n`;
  }
  txt += loadMoreRow(page);
  return txt;
}

function loadMoreRow(page) {
  return `<tr id="replaceMe">
  <td colspan="3">
    <center>
      <button class='btn primary' hx-get="/agents/?page=${page + 1}"
                       hx-target="#replaceMe"
                       hx-swap="outerHTML">
         Load More Agents... <img class="htmx-indicator" src="/img/bars.svg" alt="">
       </button>
    </center>
  </td>
</tr>`;
}

server.start("/demo");
</script>

This example shows how to implement click-to-load the next page in a table of data. The crux of the demo is
the final row:

```html

<tr id="replaceMe">
    <td colspan="3">
        <button class='btn primary' hx-get="/contacts/?page=2"
                hx-target="#replaceMe"
                hx-swap="outerHTML">
            Load More Agents... <img class="htmx-indicator" src="/img/bars.svg" alt="">
        </button>
    </td>
</tr>
```

This row contains a button that will replace the entire row with the next page of
results (which will contain a button to load the *next* page of results). And so on.
```

- [ ] **Step 2: Delete the old .md file**

```bash
rm www/src/content/patterns/01-loading/01-click-to-load.md
```

- [ ] **Step 3: Test the full flow**

Run: `cd www && bun run dev`
Navigate to `http://localhost:4321/patterns/loading/click-to-load`
Expected:
1. Demo container appears at the top (before the prose)
2. Table loads with 10 rows of "Agent Smith" data
3. "Load More Agents..." button works — clicking it adds more rows
4. Requests appear in the Network tab
5. Sidebar shows the cursor-pointer icon next to "Click to Load"
6. Index page at `/patterns` shows the icon

- [ ] **Step 4: Commit**

```bash
git add www/src/content/patterns/01-loading/
git commit -m "Migrate click-to-load pattern to .mdx with server.* API"
```

---

### Task 9: Migrate remaining pattern files with active demos

Each file follows the same general migration as Task 8, plus file-specific changes documented below. For every file:
1. Rename `.md` → `.mdx`
2. Add `icon` to frontmatter
3. Remove Jinja remnants: both `[//]: # ({{ demo_environment&#40;&#41; }})` and bare `{{ demo_environment() }}`
4. Replace `init(path, handler)` → `server.get(path, handler)` + `server.start(path)`
5. Replace `onGet/onPost/onPut/onDelete(path, handler)` → `server.get/post/put/delete(path, handler)`
6. Migrate handler signatures: `function(request, params)` → `function(req)` using `req.params`

**Per-file migration details:**

---

**`01-loading/02-infinite-scroll.md`** → `.mdx` | Icon: `icon-[mdi--arrow-expand-down]`
- Demo script is fully commented out — just rename, add icon, remove Jinja comment
- No handler migration needed

**`01-loading/03-lazy-load.md`** → `.mdx` | Icon: `icon-[bitcoin-icons--visible-filled]`
- Remove bare `{{ demo_environment() }}` (line 35)
- Replace `server.autoRespondAfter = 2000;` with `server.delay(2000);`
- Standard `init`/`onGet` → `server.get`/`server.start` migration

**`01-loading/04-progress-bar.md`** → `.mdx` | Icon: `icon-[vaadin--progressbar]`
- Remove bare `{{ demo_environment() }}` (line 105)
- The `onGet("/job/progress", function(request, params, responseHeaders){...})` handler uses a third `responseHeaders` arg. Migrate to return object:

  Before:
  ```js
  onGet("/job/progress", function(request, params, responseHeaders){
      var job = jobManager.currentProcess();
      if (job.complete) { responseHeaders["HX-Trigger"] = "done"; }
      return jobProgressTemplate(job);
  });
  ```
  After:
  ```js
  server.get("/job/progress", function(req) {
      var job = jobManager.currentProcess();
      if (job.complete) {
        return { body: jobProgressTemplate(job), headers: { "HX-Trigger": "done" } };
      }
      return jobProgressTemplate(job);
  });
  ```

**`02-forms/01-active-search.md`** → `.mdx` | Icon: `icon-[mdi--magnify]`
- Uses `init("/init", ...)` — migrate to `server.get("/init", ...)` + `server.start("/init")`
- `onPost(/\/search.*/, function(request, params){...})` → `server.post(/\/search.*/, function(req){...})`, access `req.params['search']`

**`02-forms/02-active-validation.md`** → `.mdx` | Icon: `icon-[mdi--check]`
- Remove bare `{{ demo_environment() }}` (line 83)
- Standard migration

**`02-forms/03-file-upload.md`** → `.mdx` | Icon: `icon-[ic--round-file-upload]`
- **No `init()` — no `server.start()` needed.** This file has inline HTML forms in the markdown with `onPost` handlers only.
- `onPost("/upload", function(req){...})` → `server.post("/upload", function(req){...})`
- **Important:** The `/validate` handler uses `req.requestBody` which does NOT exist in the new API. Replace with `req.body` (raw body string):

  Before:
  ```js
  onPost("/validate", function(req) {
    const name = new URLSearchParams(req.requestBody).get('name');
  ```
  After:
  ```js
  server.post("/validate", function(req) {
    const name = req.params['name'];  // or: new URLSearchParams(req.body).get('name')
  ```
- Preserve the `htmx.on('#upload-form', ...)` script separately (it's not a route handler)

**`02-forms/04-linked-selects.md`** → `.mdx` | Icon: `icon-[mdi--form-dropdown]`
- Remove bare `{{ demo_environment() }}` (line 41)
- Standard migration

**`02-forms/05-reset-on-submit.md`** → `.mdx` | Icon: `icon-[mdi--eraser]`
- Standard migration

**`03-records/01-bulk-actions.md`** → `.mdx` | Icon: `icon-[mdi--checkbox-multiple-marked]`
- Standard migration. `onPost("/users", function(req, params){...})` → `server.post("/users", function(req){...})` using `req.params`

**`03-records/02-delete-in-place.md`** → `.mdx` | Icon: `icon-[material-symbols--delete]`
- Remove bare `{{ demo_environment() }}` (line 63)
- Standard migration

**`03-records/03-drag-to-reorder.md`** → `.mdx` | Icon: `icon-[solar--reorder-linear]`
- **Preserve the external Sortable.js script tag** (`<script src="https://cdn.jsdelivr.net/.../Sortable.min.js">`) — do not remove it during migration
- Standard `init`/`onPost` migration

**`03-records/04-edit-in-place.md`** → `.mdx` | Icon: `icon-[material-symbols--edit]`
- Uses `init("/users/1", ...)`, `onGet("/users/1/edit", ...)`, `onPut("/users/1", ...)`
- The `onPut` handler uses two-arg form: `onPut("/users/1", (req, params) => {...})` — migrate to `server.put("/users/1", function(req){...})` using `req.params`

**`04-display/02-dialogs.md`** → `.mdx` | Icon: `icon-[vaadin--modal-list]`
- Uses `<script type="text/javascript">` — change to `<script>`
- Uses `init("/modal", ...)` — the button rendered by this handler has `hx-get="/modal" hx-target="body" hx-swap="beforeend"`, which swaps content into `<body>`, not `#demo-content`. This works fine — `server.start("/modal")` renders the initial button into `#demo-content`, and subsequent htmx requests target wherever they specify.
- Has inline `<style>` block — preserve it as-is
- Migrate: `server.get("/modal", ...)` + `server.start("/modal")`

**`04-display/03-tabs.md`** → `.mdx` | Icon: `icon-[mdi--tab]`
- Demo script is fully commented out — just rename, add icon, remove Jinja comment

**`06-advanced/01-keyboard-shortcuts.md`** → `.mdx` | Icon: `icon-[mdi--keyboard]`
- Uses `init("/init", ...)` → `server.get("/init", ...)` + `server.start("/init")`
- Standard `onPost` migration

---

- [ ] **Step 1: Migrate loading patterns**

Migrate `02-infinite-scroll`, `03-lazy-load`, `04-progress-bar` per the notes above.

- [ ] **Step 2: Test loading patterns**

Navigate to each URL, verify demos work (where applicable) and pages render.

- [ ] **Step 3: Commit**

```bash
git add www/src/content/patterns/01-loading/
git commit -m "Migrate loading patterns to .mdx with server.* API"
```

- [ ] **Step 4: Migrate form patterns**

Migrate `01-active-search`, `02-active-validation`, `03-file-upload`, `04-linked-selects`, `05-reset-on-submit`.

- [ ] **Step 5: Test form patterns**

- [ ] **Step 6: Commit**

```bash
git add www/src/content/patterns/02-forms/
git commit -m "Migrate form patterns to .mdx with server.* API"
```

- [ ] **Step 7: Migrate record patterns**

Migrate `01-bulk-actions`, `02-delete-in-place`, `03-drag-to-reorder`, `04-edit-in-place`.

- [ ] **Step 8: Test record patterns**

- [ ] **Step 9: Commit**

```bash
git add www/src/content/patterns/03-records/
git commit -m "Migrate record patterns to .mdx with server.* API"
```

- [ ] **Step 10: Migrate display patterns**

Migrate `02-dialogs`, `03-tabs`.

- [ ] **Step 11: Test display patterns**

- [ ] **Step 12: Commit**

```bash
git add www/src/content/patterns/04-display/
git commit -m "Migrate display patterns to .mdx with server.* API"
```

- [ ] **Step 13: Migrate advanced patterns**

Migrate `01-keyboard-shortcuts`.

- [ ] **Step 14: Test advanced patterns**

- [ ] **Step 15: Commit**

```bash
git add www/src/content/patterns/06-advanced/
git commit -m "Migrate advanced patterns to .mdx with server.* API"
```

---

### Task 10: Migrate pattern files without demos (icon + rename only)

These files have no demo scripts — just rename to `.mdx` and add `icon` frontmatter.

| File | Icon |
|------|------|
| `04-display/01-animations.md` | `icon-[mdi--animation]` |
| `05-real-time/01-bidirectional-sync.md` | `icon-[fluent--cloud-bidirectional-20-regular]` |
| `05-real-time/02-continuous-streams.md` | `icon-[circum--stream-on]` |
| `05-real-time/03-one-off-streams.md` | `icon-[cil--stream]` |
| `05-real-time/04-polling.md` | `icon-[bi--arrow-repeat]` |
| `06-advanced/02-update-other-content.md` | `icon-[mdi--sync]` |

Also rename the category index files (no icon needed, just `.md` → `.mdx`):
- `01-loading/index.md` → `index.mdx`
- `02-forms/index.md` → `index.mdx`
- `03-records/index.md` → `index.mdx`
- `04-display/index.md` → `index.mdx`
- `05-real-time/index.md` → `index.mdx`
- `06-advanced/index.md` → `index.mdx`

- [ ] **Step 1: Rename and add icons**

For each file, rename to `.mdx` and add `icon` to frontmatter.

- [ ] **Step 2: Verify build**

Run: `cd www && bun run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add www/src/content/patterns/
git commit -m "Convert remaining pattern files to .mdx with icons"
```

---

## Chunk 4: Final Verification

### Task 11: End-to-end verification

- [ ] **Step 1: Full build**

Run: `cd www && bun run build`
Expected: Build completes successfully with no errors.

- [ ] **Step 2: Verify all pattern pages load**

Start dev server: `cd www && bun run dev`

Navigate to each of these URLs and verify the page loads without errors:
- `http://localhost:4321/patterns` (index — icons should show)
- `http://localhost:4321/patterns/loading/click-to-load` (demo works)
- `http://localhost:4321/patterns/loading/lazy-load` (demo with delay)
- `http://localhost:4321/patterns/loading/progress-bar` (custom headers)
- `http://localhost:4321/patterns/forms/active-search` (search demo)
- `http://localhost:4321/patterns/records/edit-in-place` (GET/PUT)
- `http://localhost:4321/patterns/display/dialogs` (body swap)

- [ ] **Step 3: Verify sidebar icons**

On any pattern detail page, check:
- Icons render next to pattern names in the sidebar
- Icons don't render on category headers (Loading, Forms, etc.)
- Active link styling still works correctly

- [ ] **Step 4: Verify Network tab**

On a working demo page (e.g. click-to-load):
- Open DevTools Network tab
- Interact with the demo
- Verify requests appear with correct method, URL, status, and response body

- [ ] **Step 5: Commit any fixes**

If any issues were found and fixed during verification, commit them.

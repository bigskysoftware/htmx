---
includeMockServer: true
title: "Live Updates"
description: Push updates over a persistent connection
category: "Streaming HTML"
icon: "icon-[circum--stream-on]"
---

<script src="/js/ext/hx-sse.js"></script>

<script>
var _quotes = [
  { sym: "HTMX", name: "Hypermedia Inc",   price: 142.10 },
  { sym: "REST", name: "Fielding Corp",    price:  88.45 },
  { sym: "SPA",  name: "Single Page Ltd",  price:  31.02 },
  { sym: "JSON", name: "Payload Partners", price:  64.77 },
];

function _row(q) {
  let up = q.change >= 0;
  let tone = q.change === undefined ? "text-neutral-400 dark:text-neutral-500"
    : up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  let cell = "px-3 py-2 border-b border-neutral-100 dark:border-neutral-850 text-sm";
  return `<tr id="q-${q.sym}">
      <td class="${cell} font-medium text-neutral-800 dark:text-neutral-100">${q.sym}</td>
      <td class="${cell} text-neutral-500 dark:text-neutral-400">${q.name}</td>
      <td class="${cell} text-right tabular-nums text-neutral-700 dark:text-neutral-200">${q.price.toFixed(2)}</td>
      <td class="${cell} text-right tabular-nums ${tone}">${
        q.change === undefined ? "&mdash;" : (up ? "&#9650; " : "&#9660; ") + Math.abs(q.change).toFixed(2)
      }</td>
    </tr>`;
}

server.sse("/ticker", (stream) => {
  let tick = setInterval(() => {
    let q = _quotes[Math.floor(Math.random() * _quotes.length)];
    q.change = (Math.random() - 0.48) * 1.6;
    q.price = Math.max(1, q.price + q.change);
    // each event updates one row, wherever it sits on the page
    stream.send({ data: `<hx-partial hx-target="#q-${q.sym}" hx-swap="outerHTML">${_row(q)}</hx-partial>` });
  }, 700);
  stream.onclose = () => clearInterval(tick);
});

server.get("/demo", () => `
<div hx-sse:connect="/ticker" class="w-full flex flex-col gap-3">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Quotes</h3>
    <span class="htmx-indicator flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
      <span class="inline-block size-2 rounded-full bg-green-500 animate-pulse"></span> Live
    </span>
  </div>
  <table class="w-full border-collapse">
    <tbody id="quotes">${_quotes.map(_row).join("")}</tbody>
  </table>
</div>`);

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex justify-center min-h-[220px]"></div>

In this demo the server holds the connection open and pushes a row whenever a price moves. The [`hx-sse`](/extensions/hx-sse) extension keeps the stream alive for as long as the page is on screen.

## Explanation

The code for the ticker is trivial: one attribute opens the connection.

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org/dist/ext/hx-sse.js"></script>

<div hx-sse:connect="/ticker">
  <span class="htmx-indicator">Live</span>

  <table>
    <tbody id="quotes">
      <tr id="q-HTMX"><td>HTMX</td><td>142.10</td></tr>
      <tr id="q-REST"><td>REST</td><td>88.45</td></tr>
    </tbody>
  </table>
</div>
```

- [`hx-sse:connect`](/extensions/hx-sse#hx-sseconnect) opens the connection on `load` and holds it open.
- The connection element keeps the [`htmx-request`](/reference/config/htmx-config-requestClass) class while the request is open, so the [`htmx-indicator`](/reference/attributes/hx-indicator) badge inside it stays lit for the life of the connection.

The server pushes out HTML content when a price move occurs: an [`<hx-partial>`](/reference/tags/hx-partial) that targets the row it updates:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: <hx-partial hx-target="#q-HTMX" hx-swap="outerHTML"><tr id="q-HTMX">...</tr></hx-partial>

data: <hx-partial hx-target="#q-REST" hx-swap="outerHTML"><tr id="q-REST">...</tr></hx-partial>

```

## Notes

A partial's `hx-target` is an ordinary selector, so one connection can update any part of the page. The connection 
element does not even have to contain what it updates.

### Why not just `hx-get`?

An ordinary `hx-get` whose response is of content type `text/event-stream` also streams, as in 
[LLM Streaming Response](/patterns/llm-streaming-response).  Why not just use that?

`hx-sse:connect` adds the two configuration options that are good for long-lived connections:

- Reconnection: A plain `hx-get` stream ends for good when the connection drops, an `hx-sse:connect` element retries with backoff.
- Background pausing: An `hx-sse:connect` element closes when the tab it is on is hidden and resumes when it returns. Browsers cap connections per origin so this saves connections.

Both are available via the `hx-config` attribute, so you can ask for them either way:

```html
<div hx-get="/ticker" hx-trigger="load"
     hx-config="sse.reconnect:true sse.pauseOnBackground:true"></div>
```

`hx-sse:connect` is shorthand for this config, plus it triggers on `load` rather than `click`.

### Closing

The connection closes when the element leaves the DOM. To close it from the server, send a named event and name it:

```html
<div hx-sse:connect="/ticker" hx-sse:close="market-closed"></div>
```

## See also

- [LLM Streaming Response](/patterns/llm-streaming-response) when the user asks for something and the answer arrives in pieces.
- [Polling](/patterns/polling) when updates are rare enough that holding a connection open is not worth it.
- [`hx-sse`](/extensions/hx-sse) for named events, replay, and the full configuration.

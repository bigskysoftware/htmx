---
title: "hx-multipart"
description: "Stream HTML with `multipart/mixed`"
category: "Networking"
icon: "icon-[mdi--call-split]"
keywords: ["multipart", "streaming", "mixed", "parallel", "Response.parts"]
---

The `hx-multipart` extension lets one [`multipart/mixed`](https://www.rfc-editor.org/rfc/rfc2046#section-5.1.3) HTTP response stream multiple parts.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/bigskysoftware/htmx@four/src/ext/hx-multipart.min.js"></script>
```

## Usage

### Update an Element

Start with a typical htmx request using [`hx-get`](/reference/attributes/hx-get):

```html
<button hx-get="/ping">
  Ping
</button>
```

Instead of `text/html`, respond with [`multipart/mixed`](#content-type):

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

--...
Content-Type: text/html

Pong
--...--
```

<details>
<summary>Backend libraries</summary>

- **Python:** <i class="icon-[mdi--github] mx-1 inline-block size-4 -translate-y-px align-text-bottom" aria-hidden="true"></i> [`scriptogre/multipart-response`](https://github.com/scriptogre/multipart-response) for [Django](https://www.djangoproject.com/), [FastAPI](https://fastapi.tiangolo.com/), [FastHTML](https://fastht.ml/), and [Starlette](https://www.starlette.io/)

Example:

```python
from fastapi import FastAPI
from multipart_response.fastapi import MultipartResponse, Part

app = FastAPI()

@app.get("/ping", response_class=MultipartResponse)
async def ping():
    yield Part("Pong", media_type="text/html")
```

More backends are planned.

</details>

The part replaces the button's content:

```html
<button hx-get="/ping">
  Pong
</button>
```

htmx uses the same rules as with a `text/html` response:

- [`hx-target="this"`](/reference/attributes/hx-target#this)
- [`hx-swap="innerHTML"`](/reference/attributes/hx-swap#innerhtml) (from [`htmx.config.defaultSwap`](/reference/config/htmx-config-defaultSwap))

**Stream an Update**

The server can stream HTML using multiple parts:

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

--...
Content-Type: text/html

P
--...
Content-Type: text/html

Po
--...
Content-Type: text/html

Pon
--...
Content-Type: text/html

Pong
--...--
```

The button changes as each part arrives:

`Ping` → `P` → `Po` → `Pon` → `Pong`

**Choose the Swap**

Use [`hx-swap`](/reference/attributes/hx-swap) and [`hx-target`](/reference/attributes/hx-target) to choose how and where updates swap:

```html
<button hx-post="/generate"
        hx-target="next output"
        hx-swap="beforeend">
  Generate
</button>

<!-- LLM tokens stream here -->
<output></output>
```

The server streams three parts:

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

--...
Content-Type: text/html

Hello
--...
Content-Type: text/html

, world
--...
Content-Type: text/html

!
--...--
```

[`hx-swap="beforeend"`](/reference/attributes/hx-swap#beforeend--append) accumulates them in `<output>`:

```html
<output>Hello, world!</output>
```

Every part inherits the request's [`hx-target`](/reference/attributes/hx-target), [`hx-swap`](/reference/attributes/hx-swap), and [`hx-select`](/reference/attributes/hx-select).

### Update Elements

Use a normal htmx request to update several elements:

```html
<button hx-get="/events">Connect</button>

<div id="feed"></div>
<div id="status">Offline</div>
```

Part headers choose where each body swaps:

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

--...
Content-Type: text/html
HX-Target: #status

Online
--...
Content-Type: text/html
HX-Target: #feed

<p>New</p>
--...--
```

The page becomes:

```html
<button hx-get="/events">Connect</button>

<div id="feed">
  <p>New</p>
</div>
<div id="status">Online</div>
```

Like [`hx-swap-oob`](/reference/attributes/hx-swap-oob) and [`<hx-partial>`](/reference/tags/hx-partial), part headers let one response update multiple elements.

### Persistent Connections

Persistent connections reconnect after a response ends.

#### Open Connections

Use [`hx-multipart:connect`](#hx-multipartconnect) for a persistent GET connection:

```html
<div hx-multipart:connect="/events"></div>
<div id="status">Offline</div>
```

The server sends a part:

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

--...
Content-Type: text/html
HX-Target: #status

Online
--...--
```

The page becomes:

```html
<div hx-multipart:connect="/events"></div>
<div id="status">Online</div>
```

The server may hold the response open and send more parts. If it ends, `hx-multipart:connect` reconnects.

Connections open on `load`. Use [`hx-trigger`](/reference/attributes/hx-trigger) to connect later:

```html
<button id="connect">Connect</button>

<div hx-multipart:connect="/events"
     hx-trigger="click from:#connect">
</div>
```

All [`hx-trigger` modifiers](/reference/attributes/hx-trigger#event-modifiers) are supported.

#### Close Connections

Close a connection when a part fires a named event:

```html
<div hx-multipart:connect="/progress"
     hx-multipart:close="done"
     hx-target="#status"></div>

<div id="status">Working</div>
```

The server sends [`HX-Trigger`](/reference/headers/HX-Trigger) with the final part:

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

--...
Content-Type: text/html
HX-Trigger: done

Complete
--...--
```

The part still swaps, then the connection stops:

```html
<div id="status">Complete</div>
```

#### Resume Connections

Identify each part so a reconnect can start after the last successful update:

```http
--...
Content-Type: text/html
HX-Part-ID: event-42

<p>New message</p>
```

After the part's actions and swap finish, the next reconnect includes:

```http
HX-Last-Part-ID: event-42
```

The server should return parts after that ID. The client processes every returned part without deduplicating IDs.

Reset the cursor with an empty header:

```http
HX-Part-ID:
```

A missing `HX-Part-ID` leaves the cursor unchanged. A failed or cancelled part does not update it.

#### Configure Connections

You can configure `hx-multipart` in three places:

- **[`<meta name="htmx-config">`](/reference/config/htmx-config#configure-via-meta-tag)** sets global defaults from HTML.

  ```html
  <meta name="htmx-config"
        content="multipart.reconnectDelay:1s multipart.reconnectMaxAttempts:5">
  ```

- **[`htmx.config.multipart`](#config)** sets global defaults from JavaScript.

  ```js
  htmx.config.multipart.reconnectDelay = '1s'
  htmx.config.multipart.reconnectMaxAttempts = 5
  ```

- **[`hx-config`](/reference/attributes/hx-config)** overrides the defaults for one connection.

  ```html
  <div hx-multipart:connect="/events"
       hx-config="multipart.reconnectMaxAttempts:2">
  </div>
  ```

These values are read when multipart handling begins.

### Overlap Swaps

Use `multipart/parallel` so a [`swap`](/reference/attributes/hx-swap#swap) or [`settle`](/reference/attributes/hx-swap#settle) delay does not block later parts:

```http
Content-Type: multipart/parallel; boundary=...

--...
HX-Target: #one
HX-Swap: innerHTML swap:1s

First
--...
HX-Target: #two

Second
--...--
```

**With `multipart/parallel`:**

- `Second` swaps now.
- One second later, `First` swaps.

**With `multipart/mixed`:**

- Nothing swaps for one second.
- Then `First` and `Second` swap in order.

Use `multipart/parallel` only when either swap can finish first.

### Mix Content Types

With `multipart/mixed`, each part can use any [media type](https://www.iana.org/assignments/media-types/media-types.xhtml) in its `Content-Type`, including:

- JSON: `application/json`
- Audio: `audio/mpeg`
- Video: `video/mp4`
- Generic binary: `application/octet-stream`
- Custom: `application/vnd.example.binary`

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

--...
Content-Type: text/html

<p>Done</p>
--...
Content-Type: application/json

{"sentiment":"positive","confidence":0.94}
--...
Content-Type: audio/mpeg

<audio bytes>
--...--
```

One HTTP response can swap LLM-generated HTML, return structured data, and stream raw audio.

### Handle Parts Yourself

Take over a content type with [`htmx:multipart:before:part`](#htmxmultipartbeforepart):

```js
document.addEventListener('htmx:multipart:before:part', event => {
  let { part } = event.detail
  if (part.headers.get('Content-Type') !== 'application/json') return

  event.preventDefault()
  event.detail.waitUntil(part.json().then(update))
})
```

`preventDefault()` skips the built-in swap. `waitUntil()` waits for asynchronous handling.

Read the body as:

- JSON: `part.json()`
- Blob: `part.blob()`
- Bytes: `part.bytes()`
- Stream: `part.body`

## Attributes

### `hx-get`/`hx-post`/`hx-put`/...

Any htmx request can process a multipart response. Normal requests stop after one response.

```html
<button hx-post="/generate" hx-target="#result">
  Generate
</button>
```

Each part inherits the request's swap settings unless its own headers override them.

### `hx-multipart:connect`

Opens a persistent GET request:

```html
<div hx-multipart:connect="/events"></div>
```

Defaults:

- [`hx-trigger="load"`](/reference/attributes/hx-trigger#load)
- [`multipart.reconnect:true`](#multipartreconnect)
- [`multipart.pauseOnBackground:true`](#multipartpauseonbackground)

Removing the element closes its connection.

### `hx-multipart:close`

Closes a connection after a part fires the named [`HX-Trigger`](/reference/headers/HX-Trigger) event:

```html
<div hx-multipart:connect="/events"
     hx-multipart:close="done"></div>
```

## Headers

### `HX-Part-ID`

Identifies a response part for reconnecting:

```http
HX-Part-ID: event-42
```

The extension records the value after the part's actions and swap finish. A missing header leaves the current ID unchanged. An empty value resets it.

With `multipart/parallel`, the recorded ID advances only after that part and every earlier accepted part finishes successfully.

### `HX-Last-Part-ID`

Identifies the last completed part in a reconnect request:

```http
HX-Last-Part-ID: event-42
```

The server decides how to resume after that ID. The header is omitted after [`HX-Part-ID`](#hx-part-id) resets the cursor.

### `HX-*` Headers

The envelope is a normal HTTP response. It may include ordinary HTTP headers and any htmx response header.

Envelope swap headers set defaults for every part:

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...
HX-Target: #feed
HX-Swap: beforeend
HX-Select: .item

--...
Content-Type: text/html

<div class="item">First</div>
--...
Content-Type: text/html

<div class="item">Second</div>
--...--
```

Both parts select `.item` and append it to `#feed`.

Part headers override the envelope defaults:

```http
--...
Content-Type: text/html
HX-Retarget: #status
HX-Reswap: innerHTML
HX-Reselect: .message
HX-Trigger: ready

<p class="message">Ready</p>
--...--
```

This part selects `.message`, replaces `#status`, and fires `ready`.

Multipart envelopes and parts support these htmx response headers:

| Header | Effect |
|---|---|
| `HX-Target` | Set the target |
| [`HX-Retarget`](/reference/headers/HX-Retarget) | Set the target and override `HX-Target` |
| `HX-Swap` | Set the swap |
| [`HX-Reswap`](/reference/headers/HX-Reswap) | Set the swap and override `HX-Swap` |
| `HX-Select` | Select content |
| [`HX-Reselect`](/reference/headers/HX-Reselect) | Select content and override `HX-Select` |
| [`HX-Trigger`](/reference/headers/HX-Trigger) | Fire events |
| [`HX-Location`](/reference/headers/HX-Location) | Issue a follow-up htmx GET |
| [`HX-Redirect`](/reference/headers/HX-Redirect) | Navigate with a full page load |
| [`HX-Refresh`](/reference/headers/HX-Refresh) | Reload the page when set to `true` |
| [`HX-Push-Url`](/reference/headers/HX-Push-Url) | Push a browser history entry |
| [`HX-Replace-Url`](/reference/headers/HX-Replace-Url) | Replace the current browser history URL |
| [`HX-Push`](/reference/headers/HX-Push) | Deprecated; use `HX-Push-Url` |

Swap settings use this priority, from highest to lowest:

```text
TARGET
part HX-Retarget  -->  part HX-Target  -->  envelope HX-Retarget  -->  envelope HX-Target  -->  hx-target

SWAP
part HX-Reswap    -->  part HX-Swap    -->  envelope HX-Reswap    -->  envelope HX-Swap    -->  hx-swap

SELECT
part HX-Reselect  -->  part HX-Select  -->  envelope HX-Reselect  -->  envelope HX-Select  -->  hx-select
```

- Initial envelope swap headers remain the defaults after reconnecting.
- Envelope actions wait until multipart handling ends. Part actions run as each part arrives.
- `HX-Location` skips its part's swap. The connection stays open.
- `HX-Refresh` and `HX-Redirect` replace the page, which closes the connection.

### `Accept`

Advertises multipart support on every htmx request while the extension is loaded:

```http
Accept: text/html, multipart/mixed, multipart/parallel
```

Existing values are preserved.

### `Content-Type`

A multipart response must include its media type and boundary:

```http
Content-Type: multipart/mixed; boundary=...
Content-Type: multipart/parallel; boundary=...
```

Part bodies always arrive in wire order. When the first swap is slow, the handling order differs:

```text
TIME  ------------------------------------------------------------>

multipart/mixed
Part 1  [read][actions][--------- swap ---------][finished]
Part 2                                                   [read][actions][swap][finished]

multipart/parallel
Part 1  [read][actions][--------- swap ---------][finished]
Part 2                       [read][actions][swap][finished]
```

`multipart/mixed` waits for each part's swap to finish before reading the next body. `multipart/parallel` runs each part's actions in arrival order, starts its swap, then reads the next body without waiting for that swap to finish.

The [`HX-Part-ID`](#hx-part-id) cursor still advances in wire order. A later completed part waits for every earlier accepted part to finish successfully.

When every swap finishes immediately, both formats usually look the same. See [Overlap Swaps](#overlap-swaps) for a visible comparison.

Use `multipart/parallel` when:

- Parts update independent targets.
- A later update is useful before an earlier swap finishes.
- A swap delay or CSS settle phase should not block later updates.

Use `multipart/mixed` when:

- Parts update the same target.
- A part depends on the DOM produced by an earlier part.
- Arrival order must also be completion order.

Native view transitions do not run in parallel. htmx queues `transition:true` swaps globally, so `multipart/parallel` can queue the next transition sooner but still runs each transition one at a time.

The extension includes the `Response.prototype.parts()` parser for both formats.

## Events

Event data is available on `event.detail`.

Connection events expose:

```js
event.detail.connection = {
  url,
  config,
  lastPartId,
  attempt,
  status,
  cancelled
}
```

### `htmx:multipart:before:connection`

Fires before htmx reads the initial response or starts a reconnect.

```js
document.addEventListener('htmx:multipart:before:connection', event => {
  if (event.detail.connection.attempt > 5) event.preventDefault()
})
```

### `htmx:multipart:after:connection`

Fires when the initial response or a reconnect is ready to stream.

```js
document.addEventListener('htmx:multipart:after:connection', event => {
  console.log('Connected:', event.detail.connection.url)
})
```

### `htmx:multipart:before:part`

Fires before htmx reads a part body or runs its actions.

Take over the part and use `detail.waitUntil()` for asynchronous work:

```js
document.addEventListener('htmx:multipart:before:part', event => {
  let { part, waitUntil } = event.detail

  event.preventDefault()
  waitUntil(handle(part))
})
```

Cancel either way:

- call `event.preventDefault()`
- set `event.detail.cancelled` to `true`

Event detail includes:

- `connection`: the multipart connection
- `ctx`: the htmx request context
- `part`: the [`BodyPart`](#handle-parts-yourself)
- `cancelled`: set to `true` to cancel without `preventDefault()`
- `waitUntil(promise)`: wait for custom processing before this part finishes

### `htmx:multipart:after:part`

Fires after htmx runs a part's actions and swap. It does not fire when `before:part` is cancelled.

```js
document.addEventListener('htmx:multipart:after:part', event => {
  console.log('Handled:', event.detail.part.headers)
})
```

Event detail includes `connection`, `ctx`, and `part`.

### `htmx:multipart:close`

Fires when a connection closes.

```js
document.addEventListener('htmx:multipart:close', event => {
  console.log('Closed:', event.detail.reason)
})
```

`reason` is `part`, `removed`, `cancelled`, or `ended`.

### `htmx:multipart:error`

Fires after a stream, network, status, or content type error.

```js
document.addEventListener('htmx:multipart:error', event => {
  console.error('Multipart error:', event.detail.error)
})
```

- `connection`: the failed connection
- `error`: the error value
- `status`: the HTTP status when available

## Config

### `multipart.reconnect`

Control whether a completed or failed response reconnects automatically.

```html
<meta name="htmx-config" content="multipart.reconnect:false">
```

Defaults to `true` for `hx-multipart:connect` and `false` for normal htmx requests.

### `multipart.reconnectDelay`

Set how long to wait before the first reconnect attempt.

```html
<meta name="htmx-config" content="multipart.reconnectDelay:1s">
```

Defaults to `500` milliseconds. Each failed attempt doubles the delay, and values may be milliseconds or time strings such as `500ms`, `1s`, and `2m`.

### `multipart.reconnectMaxDelay`

Limit how long to wait between reconnect attempts.

```html
<meta name="htmx-config" content="multipart.reconnectMaxDelay:30s">
```

Defaults to `60000` milliseconds. Use milliseconds or a time string.

### `multipart.reconnectMaxAttempts`

Limit how many consecutive failed reconnects are attempted.

```html
<meta name="htmx-config" content="multipart.reconnectMaxAttempts:5">
```

Defaults to `Infinity`.

### `multipart.reconnectJitter`

Spread reconnect attempts so many clients do not retry at once.

```html
<meta name="htmx-config" content="multipart.reconnectJitter:0">
```

Defaults to `0.3`, which randomizes each delay by up to ±30%. Use `0` for exact delays.

### `multipart.pauseOnBackground`

Close the request while the page is hidden and reconnect when it becomes visible.

```html
<meta name="htmx-config" content="multipart.pauseOnBackground:false">
```

Defaults to `true` for `hx-multipart:connect` and `false` for normal htmx requests. Use [`HX-Part-ID`](#hx-part-id) and server-side replay to recover parts sent while disconnected.

## How `multipart/mixed` Works

A normal HTML response has one body:

```http
HTTP/1.1 200 OK
Content-Type: text/html

<p>One update</p>
```

A multipart response puts many header/body pairs inside that body:

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

--...
Content-Type: text/html
HX-Target: #one

First
--...
Content-Type: text/html
HX-Target: #two

Second
--...--
```

| Example | Meaning |
|---|---|
| `HTTP/1.1 200 OK` | Status for the whole response |
| `boundary=...` | Names the boundary |
| `--...` | Starts the next part |
| `Content-Type` and `HX-Target` | Headers for that part |
| Empty line | Starts the part body |
| `First` and `Second` | Part bodies |
| `--...--` | Ends the response |

The status line appears once. Parts have no status codes.

<details>
<summary>How does a part body end?</summary>

```http
--...
Content-Type: text/plain
Content-Length: 5

Hello
--...--
```

| Part header | htmx reads |
|---|---|
| `Content-Length: 5` | The next five bytes |
| No `Content-Length` | Until the next boundary |

A boundary always follows the body. If the boundary is `part`, a body line starting with `--part` will be mistaken for the next part.

</details>

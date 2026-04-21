---
title: "Download"
description: "Save responses as file downloads with streaming progress."
keywords: ["download", "file", "save", "progress", "streaming"]
---

The `download` extension saves a response as a file download instead of swapping it into the DOM. It streams the response body and fires progress events.

It activates in three ways:

- `hx-swap="download"` on the element
- The server responds with `Content-Disposition: attachment` (auto-detected, no attribute needed)
- The server responds with `HX-Download: <url>` (extension fetches that URL as the download, while the original response is still swapped normally)

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-download.js"></script>
```

## Usage

### Explicit swap style

Use `hx-swap="download"` to always treat the response as a download:

```html
<button hx-get="/files/report.pdf" hx-swap="download">
    Download Report
</button>
```

### Auto-detect via Content-Disposition

If the server returns `Content-Disposition: attachment`, the extension triggers a download automatically — no `hx-swap` needed:

```html
<button hx-get="/files/report.pdf" hx-target="#result">
    Download Report
</button>
```

```http
Content-Disposition: attachment; filename="report.pdf"
```

### HX-Download header

When the backend cannot stream the file directly as the htmx response (e.g. it needs to redirect to a separate download endpoint), return an `HX-Download` header pointing to the file URL. The extension will fetch that URL as the download while htmx processes the original response body as a normal swap:

```html
<button hx-get="/prepare-download" hx-target="#status">
    Download Report
</button>
```

```http
HX-Download: /files/report.pdf
Content-Type: text/html

<span>Your download has started...</span>
```

The `<span>` is swapped into `#status` and the file at `/files/report.pdf` is downloaded simultaneously.

This approach also avoids the indicator/disabled-element cleanup problem that occurs with `HX-Redirect` pointing to a download URL — indicators are cleared correctly after the original request completes.

### Progress Bar

The extension fires events on the source element as the response streams in:

```html
<button hx-get="/files/report.pdf" hx-swap="download">
    Download Report
</button>
<progress id="prog" value="0" max="100"></progress>

<script>
document.body.addEventListener("htmx:download:progress", e => {
    document.getElementById("prog").value = e.detail.percent
})
</script>
```

The server must send a `Content-Length` header for percentage-based progress. Without it, `percent` will be `null` and only `loaded` (bytes received) is available.

## Events

| Event | Detail | Description |
|---|---|---|
| `htmx:download:start` | `{total}` | Response headers received, streaming begins. `total` is `null` if no `Content-Length` |
| `htmx:download:progress` | `{loaded, total, percent}` | Fired for each chunk received. `percent` is `null` if no `Content-Length` |
| `htmx:download:complete` | `{filename, size}` | File download triggered in the browser |

## Notes

- Binary files (PDFs, images, archives) are handled correctly.
- The filename is extracted from the `Content-Disposition` header (`filename` or `filename*=UTF-8''...`), falling back to the URL's last path segment.
- Cancellation works automatically via htmx's built-in request abort handling.
- For `HX-Download`, indicators and disabled elements are cleared correctly after the original request completes — the secondary fetch runs independently.

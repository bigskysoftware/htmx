---
title: "Download"
description: "Save responses as file downloads with streaming progress."
keywords: ["download", "file", "save", "progress", "streaming"]
---

The `download` extension adds a `download` swap style that saves the response as a file instead of swapping it into the DOM. It streams the response body and fires progress events.

## Installing

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/hx-download.js"></script>
```

## Usage

Use `hx-swap="download"` on any element that should trigger a file download:

```html
<button hx-get="/files/report.pdf" hx-swap="download">
    Download Report
</button>
```

The filename is extracted from the `Content-Disposition` header, falling back to the URL's last path segment.

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

The server must send a `Content-Length` header for percentage-based progress. Without it, `percent` will be `null`.

## Events

| Event | Detail | Description |
|---|---|---|
| `htmx:download:start` | `{total}` | Response headers received, streaming begins |
| `htmx:download:progress` | `{loaded, total, percent}` | Fired for each chunk received |
| `htmx:download:complete` | `{filename, size}` | File download triggered |

## Notes

- Only the response body is downloaded: no DOM swap occurs.
- Cancellation works automatically via htmx's built-in request abort handling.
- Binary files (PDFs, images, archives) are handled correctly.

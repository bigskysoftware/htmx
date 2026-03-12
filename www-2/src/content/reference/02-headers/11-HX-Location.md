---
title: "HX-Location"
description: "Client-side AJAX navigation to a new URL"
---

Navigate to a new URL without a full page reload.

Like clicking a boosted link—htmx fetches the content and updates the page via AJAX.

## Simple Usage

Redirect to a path:

```http
HX-Location: /dashboard
```

## Advanced Usage

Specify target and other options:

```http
HX-Location: {"path":"/search", "target":"#results", "push":"false"}
```

## Options

The JSON value mirrors the htmx ajax API. All fields except `path` are optional.

- `path` - URL to load the response from (required)
- `target` - Element to swap the response into (defaults to `document.body`)
- `source` - The source element of the request
- `event` - Event that triggered the request
- `handler` - Callback to handle the response HTML
- `swap` - How to swap the response relative to the target
- `values` - Values to submit with the request
- `headers` - Headers to submit with the request
- `select` - Selects content from the response to swap
- `push` - Prevents or overrides the URL pushed to history (`'false'` or a path string)
- `replace` - Path to replace in browser history instead of pushing

## Notes

Response headers are not processed on 3xx response codes. Return a 2xx status when using this header.

## Example

```python
headers = {'HX-Location': '/profile'}
return Response(content, headers=headers)
```

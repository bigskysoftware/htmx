---
title: "HX-Location"
description: "Client-side AJAX navigation to a new URL"
---

# HX-Location

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

- `path` - URL to fetch (required)
- `target` - Element to update
- `source` - Source element
- `swap` - How to swap content
- `push` - Add to history (default: `true`)
- `replace` - Replace in history

## Example

```python
headers = {'HX-Location': '/profile'}
return Response(content, headers=headers)
```

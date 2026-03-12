---
title: "HX-Request"
description: "Indicates a request was made by htmx"
---

The `HX-Request` header indicates the request was made by htmx.

It's value is always `true`.

## Syntax

```http
HX-Request: true
```

## Usage

Use it to detect htmx requests on the server:

```python
if request.headers.get('HX-Request'):
    # This is an htmx request
    return render_template('partial.html')
else:
    # This is a regular browser request
    return render_template('full.html')
```

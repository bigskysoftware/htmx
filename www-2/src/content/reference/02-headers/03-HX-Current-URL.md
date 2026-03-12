---
title: "HX-Current-URL"
description: "Contains the URL of the browser when the request was made"
---

The `HX-Current-URL` request header contains the browser's URL when the request was made.

Use it to understand page context or build relative URLs.

## Syntax

The header is included as follows:

```http
HX-Current-URL: https://example.com/products
```

## Usage

Read the current URL from the request:

```python
current_url = request.headers.get('HX-Current-URL')
```

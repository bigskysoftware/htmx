---
title: "HX-Request-Type"
description: "Indicates if this is a partial or full page request"
---

The `HX-Request-Type` request header indicates if request targets a specific element or the whole page.

## Syntax

```http
HX-Request-Type: partial

// or

HX-Request-Type: full
```

## Values

This header is added automatically.

### `full`

Used when the [target](/docs/core-concepts/targets) is the document body, or when selecting elements from the response (with [`hx-select`](/reference/attributes/hx-select)).

```html
<!-- If target is body (explicit) -->
<button hx-get=... hx-target="body">

<!-- If target is body (implicit) -->
<a href=... hx-boost="true">

<!-- If selecting elements from response -->
<div hx-get=... hx-select=".content">
```

**Note:** [`hx-boost="true"`](/reference/attributes/hx-boost) implicitly sets [`hx-target="body"`](/reference/attributes/hx-target).

### `partial`

Used when the target is any other element.

```html
<!-- If target is any element (except body) -->
<button hx-get="..." hx-target="#results">...</button>

<!-- If target is not set (defaults to this element) -->
<div hx-post="...">...</div>
```

## Examples

Use it on the server to customize response behavior:

```python
request_type = request.headers.get('HX-Request-Type')
if request_type == 'full':
    return render_full_page()
else:
    return render_fragment()
```

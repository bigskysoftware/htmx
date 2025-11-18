+++
title = "HX-Request-Type"
+++

The `HX-Request-Type` request header indicates the type of request being sent, allowing backend servers and caching layers to determine what kind of response to return.

## Purpose

While the `HX-Request` header identifies htmx-initiated requests, it doesn't distinguish between full page requests and partial updates. The `HX-Request-Type` header provides this additional context, which is especially useful when using features like [`hx-boost`](@/attributes/hx-boost.md), [`hx-select`](@/attributes/hx-select.md), and history restoration.

## Values

| Value | Description |
|-------|-------------|
| *(not set)* | Full page requests initiated by the browser, history restore requests, or requests targeting `document.body` (like most [`hx-boost`](@/attributes/hx-boost.md) requests) |
| `partial` | Request is targeting replacement of part of the page and expects a partial HTML fragment |
| `hx-select:<selectors>` | Request expects content containing elements matching the comma-separated CSS selectors from [`hx-select`](@/attributes/hx-select.md) and [`hx-select-oob`](@/attributes/hx-select-oob.md) |

## Usage

### Basic Partial vs Full Page Detection

```python
if request.headers.get('HX-Request-Type') == 'partial':
    return render_partial()
else:
    return render_full_page()
```

### Optimizing Responses with hx-select

When the header contains `hx-select:`, you can parse the selectors to optimize your backend response:

```python
request_type = request.headers.get('HX-Request-Type', '')
if request_type.startswith('hx-select:'):
    selectors = request_type[10:].split(',')  # Extract selectors
    return render_only(selectors)
```

### Caching

Use the [`Vary`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#vary) response header to cache full and partial responses separately:

```
Vary: HX-Request-Type
```

This ensures that full page and partial responses are cached independently.

## Examples

### Partial Request
```html
<button hx-get="/users" hx-target="#user-list">
    Load Users
</button>
```
Sends: `HX-Request-Type: partial`

### Boosted Full Page Request
```html
<a href="/about" hx-boost="true">About</a>
```
Sends: *(header not set)*

### Selective Content Request
```html
<div hx-get="/page" 
     hx-select="#content, #sidebar"
     hx-target="#main">
    Load
</div>
```
Sends: `HX-Request-Type: hx-select:#content,#sidebar`

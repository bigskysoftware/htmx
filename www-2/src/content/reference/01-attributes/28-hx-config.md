---
title: "hx-config"
description: "Configure request behavior with JSON"
---

# hx-config

The `hx-config` attribute allows you to configure request behavior using JSON.

## Syntax

```html
<button hx-post="/api/users" hx-config='{"timeout": 5000}'>
    Create User
</button>
```

## Available Options

| Option        | Type    | Description                                              | Example       |
|---------------|---------|----------------------------------------------------------|---------------|
| `timeout`     | number  | Request timeout in milliseconds                          | 5000          |
| `credentials` | string  | Fetch credentials mode: "omit", "same-origin", "include" | "include"     |
| `mode`        | string  | Fetch mode: "cors", "no-cors", "same-origin"             | "cors"        |
| `cache`       | string  | Fetch cache mode: "default", "no-cache", "reload", etc.  | "no-cache"    |
| `redirect`    | string  | Fetch redirect mode: "follow", "error", "manual"         | "follow"      |
| `referrer`    | string  | Referrer URL or "no-referrer"                            | "no-referrer" |
| `integrity`   | string  | Subresource integrity value                              | "sha384-..."  |
| `validate`    | boolean | Whether to validate form before submission               | true          |

These options map to the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

## Merging Configuration

By default, child `hx-config` values replace parent configurations entirely. Use the `+` prefix to merge with parent config instead:

```html
<div hx-config='{"timeout": 5000}'>
    <button hx-get="/data"
            hx-config='{"+headers": {"X-Custom": "value"}}'>
        Load Data
    </button>
</div>
```

The button inherits the timeout and adds a custom header.

Without `+`, the child config replaces the parent config entirely.

## Examples

### Set timeout for slow endpoint

```html
<button hx-get="/slow-report"
        hx-config='{"timeout": 30000}'>
    Generate Report
</button>
```

### Include credentials for CORS

```html
<button hx-get="https://api.example.com/data"
        hx-config='{"credentials": "include", "mode": "cors"}'>
    Load External Data
</button>
```

### Disable cache

```html
<button hx-get="/live-data"
        hx-config='{"cache": "no-cache"}'>
    Get Live Data
</button>
```

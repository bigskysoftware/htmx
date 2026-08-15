---
title: "hx-config"
description: "Configures request behavior"
---

The `hx-config` attribute configures request behavior with [HCON](/docs#hcon) or JSON.

## Syntax

```html
<button hx-post="/api/users" hx-config="timeout:5s">
  Create User
</button>
```

Or use JSON:

```html
<button hx-post="/api/users" hx-config='{"timeout":5000}'>
  Create User
</button>
```

## Available Options

| Option        | Type    | Description                                              | Example       |
|---------------|---------|----------------------------------------------------------|---------------|
| `timeout`     | number  | Request timeout in milliseconds                          | 5000          |
| `credentials` | string  | Fetch credentials mode: "omit", "same-origin", "include" | "include"     |
| `cache`       | string  | Fetch cache mode: "default", "no-cache", "reload", etc.  | "no-cache"    |
| `redirect`    | string  | Fetch redirect mode: "follow", "error", "manual"         | "follow"      |
| `referrer`    | string  | Referrer URL or "no-referrer"                            | "no-referrer" |
| `integrity`   | string  | Subresource integrity value                              | "sha384-..."  |
| `validate`    | boolean | Whether to validate form before submission               | true          |

These options map to the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

> **Security note:** The `mode` option is intentionally excluded from `hx-config`. It is always
> reset to the global `htmx.config.mode` value (default: `"same-origin"`) to prevent injection
> attacks from widening request scope. To change the mode in markup, set it globally through
> `htmx.config.mode` or a `<meta name="htmx-config">` tag. See the
> [mode config reference](/reference/config/htmx-config-mode) and
> [security best practices](/docs#best-practices) for details.

## Inheritance

Use `:inherited` to share config with descendants:

```html
<div hx-config:inherited="timeout:5s">
  <button hx-get="/data">Load</button>
</div>
```

Use `:append` to add child config:

```html
<div hx-config:inherited="timeout:5s">
  <button hx-get="/data" hx-config:append="cache:no-cache">
    Load
  </button>
</div>
```

The button uses both `timeout:5s` and `cache:no-cache`.

## Examples

### Set timeout for slow endpoint

```html
<button hx-get="/slow-report"
        hx-config='{"timeout": 30000}'>
    Generate Report
</button>
```

### Include credentials

```html
<button hx-get="/api/data"
        hx-config='{"credentials": "include"}'>
    Load Data
</button>
```

### Disable cache

```html
<button hx-get="/live-data"
        hx-config='{"cache": "no-cache"}'>
    Get Live Data
</button>
```

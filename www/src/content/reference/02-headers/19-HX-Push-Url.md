---
title: "HX-Push-Url"
description: "Pushes URL into browser history stack"
---

The `HX-Push-Url` response header pushes a URL into browser history.

It creates a new entry for back and forward navigation.

If present, this header overrides any behavior defined with attributes.

## Possible Values

- A URL to be pushed into the location bar. May be relative or absolute, as per [`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).
- `false` — prevents the browser's history from being updated.

## Example

```http
HX-Push-Url: /dashboard
```

## Notes

- Response headers are not processed on 3xx response codes.

See also: [`hx-push-url`](/reference/attributes/hx-push-url), [`HX-Replace-Url`](/reference/headers/HX-Replace-Url)

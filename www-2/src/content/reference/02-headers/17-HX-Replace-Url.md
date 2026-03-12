---
title: "HX-Replace-Url"
description: "Replace the current URL in the browser history"
---

The `HX-Replace-Url` response header replaces the current URL in the browser location history. This does not create a new history entry — it removes the previous current URL from the browser's history.

If present, this header overrides any behavior defined with attributes.

## Possible Values

- A URL to replace the current URL in the location bar. May be relative or absolute, as per [`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState), but must have the same origin as the current URL.
- `false` — prevents the browser's current URL from being updated.

## Example

```http
HX-Replace-Url: /dashboard
```

## Notes

- Response headers are not processed on 3xx response codes.

See also: [`hx-replace-url`](/reference/attributes/hx-replace-url), [`HX-Push-Url`](/reference/headers/hx-push-url)

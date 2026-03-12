---
title: "Caching"
description: "Set up HTTP caching with ETags for performance"
keywords: ["etag", "cache", "304", "if-none-match", "performance"]
---

htmx works with standard [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
mechanisms out of the box.

If your server adds the
[`Last-Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)
HTTP response header to the response for a given URL, the browser will automatically add the
[`If-Modified-Since`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since)
request HTTP header to the next requests to the same URL.

## ETag Support

htmx supports [`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)-based caching on a per-element
basis. When your server includes an `ETag` header in the response, htmx will store the ETag value and automatically
include it in the [`If-None-Match`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match)
header for subsequent requests from that element.

This allows your server to return a [`304 Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304)
response when the content hasn't changed.

You can set an etag on an element initially by using the [`hx-config`](/reference/attributes/hx-config) attribute:

```html
<div id="news" hx-get="/news"
     hx-trigger="every 3s"
     hx-config='"etag":"1762656750"'>
    Latest News...
</div>
```

When this div issues a poll-based request it will submit an `If-None-Match` header and the server can respond with a
`304 Not Modified` if no new news is available.

Be mindful that if your server can render different content for the same URL depending on some other
headers, you need to use the [`Vary`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#vary)
response HTTP header.

For example, if your server renders the full HTML when the [`HX-Request`](/reference/headers/hx-request) header is missing or `false`, and it renders a
fragment of that HTML when `HX-Request: true`, you need to add `Vary: HX-Request`. That causes the cache to be keyed
based on a composite of the response URL and the `HX-Request` request header rather than being based just on the
response URL.

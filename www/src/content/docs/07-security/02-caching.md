---
title: "Caching"
description: "Set up HTTP caching for performance"
keywords: ["cache", "304", "performance", "last-modified", "vary"]
---

htmx works with standard [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
mechanisms out of the box.

If your server adds the
[`Last-Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)
HTTP response header to the response for a given URL, the browser will automatically add the
[`If-Modified-Since`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since)
request HTTP header to the next requests to the same URL.

For polling use cases where you want the server to skip responses when content hasn't changed, see the [`ptag` extension](/docs/extensions/ptag).

Be mindful that if your server can render different content for the same URL depending on some other
headers, you need to use the [`Vary`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#vary)
response HTTP header.

For example, if your server renders the full HTML when the [`HX-Request`](/reference/headers/HX-Request) header is missing or `false`, and it renders a
fragment of that HTML when `HX-Request: true`, you need to add `Vary: HX-Request`. That causes the cache to be keyed
based on a composite of the response URL and the `HX-Request` request header rather than being based just on the
response URL.

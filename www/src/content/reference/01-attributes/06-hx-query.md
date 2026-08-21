---
title: "hx-query"
description: "Issues `QUERY` request to specified URL"
---

The `hx-query` attribute will cause an element to issue a `QUERY` to the specified URL and swap
the HTML into the DOM using a swap strategy.

## Syntax

```html
<button hx-query="/search">Search</button>
```

This example will cause the `button` to issue a `QUERY` to `/search` and swap the returned HTML into
the `innerHTML` of the `button`.

## Notes

* `QUERY` is a safe, idempotent method ([RFC 10008](https://datatracker.ietf.org/doc/html/rfc10008)) that sends content in the request body like `POST`
* You can control the target of the swap using the [`hx-target`](/reference/attributes/hx-target) attribute
* You can control the swap strategy by using the [`hx-swap`](/reference/attributes/hx-swap) attribute
* You can control what event triggers the request with the [`hx-trigger`](/reference/attributes/hx-trigger) attribute
* You can control the data submitted with the request in various ways, documented
  here: [Parameters](/docs#parameters)

+++
title = "HX-Redirect Response Header"
description = """\
  Use the HX-Redirect response header in htmx to trigger a client-side redirection that will perform a full page \
  reload."""
+++

This response header can be used to trigger a client side redirection to a new url that will do a full reload of the whole page. It uses the browser to redirect to the new location which can be useful when redirecting to non htmx endpoints that may contain different HTML `head` content or scripts.  See [`HX-Location`](@/headers/hx-location.md) if you want more control over the redirect or want to use ajax requests instead of full browser reloads. 

A sample response would be:

```html
HX-Redirect: /test
```

Which would push the client to test as if the user had entered this url manually or clicked on a non-boosted link `<a href="/test">`

## Notes

Response headers are not processed on 3xx response codes. see [Response Headers](@/docs.md#response-headers)

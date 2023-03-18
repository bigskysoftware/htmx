+++
title = "HX-Replace-Url Response Header"
+++

The `HX-Replace-Url` header allows you to replace the current URL in the browser [location history](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
This does not create a new history entry; in effect, it removes the previous current URL from the browser&rsquo;s history.
This is similar to the [`hx-replace-url` attribute](@/attributes/hx-replace-url.md).

If present, this header overrides any behavior defined with attributes.

The possible values for this header are:

1. A URL to replace the current URL in the location bar.
   This may be relative or absolute, as per [`history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState), but must have the same origin as the current URL.
2. `false`, which prevents the browser’s current URL from being updated.

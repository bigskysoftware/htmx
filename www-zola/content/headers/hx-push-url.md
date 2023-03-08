+++
title = "HX-Push-Url Response Header"
+++

The `HX-Push-Url` header allows you to push a URL into the browser [location history](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
This creates a new history entry, allowing navigation with the browser’s back and forward buttons.
This is similar to the [`hx-push-url` attribute](@/attributes/hx-push-url.md).

If present, this header overrides any behavior defined with attributes.

The possible values for this header are:

1. A URL to be pushed into the location bar.
   This may be relative or absolute, as per [`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).
2. `false`, which prevents the browser’s history from being updated.

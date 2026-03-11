---
title: "History"
description: "Integrate with browser history and navigation"
keywords: ["back button", "pushState", "replaceState", "navigation", "SPA"]
---

<details class="warning">
<summary>Changes in htmx 4.0</summary>

History support in htmx 4.0 has changed significantly. We no longer snapshot the DOM and keep a copy in sessionStorage.

Instead, we issue a full page request every time someone navigates to a history element. This is much less error-prone
and foolproof. It also eliminates security concerns regarding keeping history state in accessible storage

This change makes history restoration much more reliable and reduces client-side complexity.

</details>

Htmx provides a simple mechanism for interacting with
the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

If you want a given element to push its request URL into the browser navigation bar and add the current state of the
page
to the browser's history, include the [hx-push-url](/reference/attributes/hx-push-url) attribute:

```html
<a hx-get="/blog" hx-push-url="true">Blog</a>
```

When a user clicks on this link, htmx will push a new location onto the history stack.

When a user hits the back button, htmx will retrieve the old content from the original URL and swap it back into the
body,
simulating "going back" to the previous state.

**NOTE:** If you push a URL into the history, you **must** be able to navigate to that URL and get a full page back!
A user could copy and paste the URL into an email, or new tab.

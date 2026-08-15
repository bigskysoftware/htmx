---
title: "hx-push-url"
description: "Pushes URL into browser history"
---

The `hx-push-url` attribute pushes a URL into browser history.

This creates a history entry for back and forward navigation. Core htmx restores the page by fetching its URL again.
Use the [`hx-history-cache`](/extensions/hx-history-cache) extension to restore saved DOM snapshots instead.

## Syntax

```html
<div hx-get="/account" hx-push-url="true">Go to My Account</div>
```

The possible values of this attribute are:

1. `true`, which pushes the fetched URL into history.
2. `false`, which disables pushing the fetched URL if it would otherwise be pushed due to inheritance or
   [`hx-boost`](/reference/attributes/hx-boost).
3. A URL to be pushed into the location bar.
   This may be relative or absolute, as per [
   `history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

Here is an example:

```html
<div hx-get="/account" hx-push-url="true">
  Go to My Account
</div>
```

This pushes `/account` into the browser history. Returning to this entry causes core htmx to fetch `/account` again.

Another example:

```html
<div hx-get="/account" hx-push-url="/account/home">
  Go to My Account
</div>
```

This will push the URL `/account/home' into the location history.

## Notes

* The [`HX-Push-Url` response header](/reference/headers/HX-Push-Url) has similar behavior and can override this attribute.

---
title: "hx-push-url"
description: "Push URL into browser history"
---

The `hx-push-url` attribute allows you to push a URL into the
browser [location history](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
This creates a new history entry, allowing navigation with the browser's back and forward buttons.
htmx snapshots the current DOM and saves it into its history cache, and restores from this cache on navigation.

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

This will cause htmx to snapshot the current DOM to `localStorage` and push the URL `/account' into the browser location
bar.

Another example:

```html
<div hx-get="/account" hx-push-url="/account/home">
  Go to My Account
</div>
```

This will push the URL `/account/home' into the location history.

## Notes

* The [`HX-Push-Url` response header](/reference/headers/hx-push-url) has similar behavior and can override this attribute.

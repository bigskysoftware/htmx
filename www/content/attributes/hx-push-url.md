+++
title = "hx-push-url"
description = """\
  The hx-push-url attribute in htmx allows you to push a URL into the browser location history. This creates a new \
  history entry, allowing navigation with the browser's back and forward buttons."""
+++

The `hx-push-url` attribute allows you to push a URL into the browser [location history](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
This creates a new history entry, allowing navigation with the browser’s back and forward buttons.
htmx snapshots the current DOM and saves it into its history cache, and restores from this cache on navigation.

The possible values of this attribute are:

1. `true`, which pushes the fetched URL into history.
2. `false`, which disables pushing the fetched URL if it would otherwise be pushed due to inheritance or [`hx-boost`](/attributes/hx-boost).
3. A URL to be pushed into the location bar.
   This may be relative or absolute, as per [`history.pushState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState).

Here is an example:

```html
<div hx-get="/account" hx-push-url="true">
  Go to My Account
</div>
```

This will cause htmx to snapshot the current DOM to `localStorage` and push the URL `/account' into the browser location bar.

Another example:

```html
<div hx-get="/account" hx-push-url="/account/home">
  Go to My Account
</div>
```

This will push the URL `/account/home' into the location history.

## Notes

* `hx-push-url` is inherited and can be placed on a parent element
* The [`HX-Push-Url` response header](@/headers/hx-push-url.md) has similar behavior and can override this attribute.
* The [`hx-history-elt` attribute](@/attributes/hx-history-elt.md) allows changing which element is saved in the history cache.

---
title: "hx-replace-url"
description: "Replaces current URL in browser history"
---

The `hx-replace-url` attribute allows you to replace the current url of the
browser [location history](https://developer.mozilla.org/en-US/docs/Web/API/History_API).

This overwrites the current history entry rather than adding one. Core htmx restores the page by fetching
its URL again. Use the [`hx-history-cache`](/extensions/hx-history-cache) extension to restore saved DOM
snapshots instead.

## Syntax

```html
<div hx-get="/account" hx-replace-url="true">Go to My Account</div>
```

The possible values of this attribute are:

1. `true`, which replaces the fetched URL in the browser navigation bar.
2. `false`, which disables replacing the fetched URL if it would otherwise be replaced due to inheritance.
3. A URL to be replaced into the location bar.
   This may be relative or absolute, as per [
   `history.replaceState()`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState).

Here is an example:

```html
<div hx-get="/account" hx-replace-url="true">
  Go to My Account
</div>
```

This replaces the current history entry with `/account` in the browser location bar.

Another example:

```html
<div hx-get="/account" hx-replace-url="/account/home">
  Go to My Account
</div>
```

This replaces the current history entry with `/account/home` in the browser location bar.

## Notes

* The [`HX-Replace-Url` response header](/reference/headers/HX-Replace-Url) has similar behavior and can override this attribute.
* The [`hx-push-url` attribute](/reference/attributes/hx-push-url) is a similar and more commonly used attribute, which creates a
  new history entry rather than replacing the current one.

---
layout: layout.njk
title: </> htmx - HX-Trigger Response Headers
---

## `HX-Push` Response Header

The `hx-push-url` attribute allows you to "push" a new entry into the browser location bar, which creates
a new history entry, allowing back-button and general history navigation.  The possible values of this
attribute are `true`, `false` or a custom string.

This response headers allows you to "push" a new entry into the browser location bar, similar to how the [`hx-push-url` attribute](/attributes/hx-push-url) works in htmx markup.  This creates a new history entry, allowing back-button and general history navigation.

If present, this header value overrides the default behavior defined in htmx markup.  For example: The possible values of this attribute are `true`, `false` or a custom string.

Possible values for this header are 1) any valid URL to be pushed into the location bar, or 2) the string `false`, which prevents the browser's history from being updated.

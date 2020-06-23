---
layout: layout.njk
title: </> htmx - hx-push-url
---

## `hx-push-url`

The `hx-push-url` attribute allows you to "push" a new entry into the browser location bar, which creates
a new history entry, allowing back-button and general history navigation.  The possible values of this
attribute are `true` and `false`.

Here is an example:

```html
<div hx-get="/account" hx-push-url="true">
  Go to My Account
</div>
```

This will cause htmx to snapshot the current DOM to `localStorage` and push the URL `/account' into the browser 
location bar. 

### Notes

* `hx-push-url` is inherited and can be placed on a parent element
* see also the `HX-Push` response header

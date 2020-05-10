---
layout: layout.njk
title: </> kutty - kt-push-url
---

## `kt-push-url`

The `kt-push-url` attribute allows you to "push" a new entry into the browser location bar, which creates
a new history entry, allowing back-button and general history navigation.  The possible values of this
attribute are `true` and `false`.

Here is an example:

```html
<div kt-get="/account" kt-push-url="true">
  Go to My Account
</div>
```

This will cause kutty to snapshot the current DOM to `localStorage` and push the URL `/account' into the browser 
location bar. 

### Notes

* `kt-push-url` is inherited and can be placed on a parent element
* see also the `X-KT-Push` response header

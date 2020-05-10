---
layout: layout.njk
title: </> kutty - kt-history-elt
---

## `kt-history-elt`

The `kt-history-elt` attribute allows you to specify the element that will be used to snapshot and
restore page state during navigation.  By default, the `body` tag is used.  This is typically
good enough for most setups, but you may want to narrow it down to a child element.  Just make
sure that the element is always visible in your application, or kutty will not be able to restore
history navigation properly.


Here is an example:

```html
<html>
<body>
<div id="content" kt-history-elt>
 ...
</div>
</body>
</html>
```

### Notes

* `kt-history-elt` is not inherited
* In most cases we don't recommend narrowing the history snapshot
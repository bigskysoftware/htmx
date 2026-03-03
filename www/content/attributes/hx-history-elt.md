+++
title = "hx-history-elt"
description = """\
  The hx-history-elt attribute in htmx allows you to specify the element that will be used to snapshot and restore \
  page state during navigation. In most cases we do not recommend using this element."""
+++

The `hx-history-elt` attribute allows you to specify the element that will be used to snapshot and
restore page state during navigation.  By default, the `body` tag is used.  This is typically
good enough for most setups, but you may want to narrow it down to a child element.  Just make
sure that the element is always visible in your application, or htmx will not be able to restore
history navigation properly.


Here is an example:

```html
<html>
<body>
<div id="content" hx-history-elt>
 ...
</div>
</body>
</html>
```

## Notes

* `hx-history-elt` is not inherited
* In most cases we don't recommend narrowing the history snapshot

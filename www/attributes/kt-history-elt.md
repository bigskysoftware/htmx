---
layout: layout.njk
title: </> kutty - kt-history-elt
---

## `kt-history-elt`

The `kt-history-elt` attribute allows you to specify an element as the place
where [history support](/docs#history) will capture HTML from and restore it to 
during history navigation.

By default the `body` tag is used but you may want to narrow this to a child
element.  Be careful if you do, however: the element must be present on all pages
in your application or a history navigation may fail.

Here is an example:

```html
<body>
  <div class="menu">...</div>
  <div class="content" kt-history-elt="true">
    ...
  </div>
</body>
```

Kutty will snapshot and restore history to the inner `.content` div.

### Notes

* By and large we recommend not using this attribute
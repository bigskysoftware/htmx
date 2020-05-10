---
layout: layout.njk
title: </> kutty - kt-swap-oob
---

## `kt-swap-oob`

The `kt-swap-oob` attribute allows you specify that some content in a response should be swapped into 
the DOM somewhere other than the target, that is "Out of Band".  This allows you to piggy back updates
to other element updates on a response.

Consider the following response HTML: 

```html
<div>
 ...
</div>
<div id="alerts" kt-swap-oob="true">
    Saved!
</div>

```

The first div will be swapped into the target the usual manner.  The second div, however, will be swapped in
as a replacement for the element with the id `alerts`, and will not end up in the target.

### Notes

* `kt-swap-oob` is not inherited
* `kt-swap-oob` is only supported on top level elements in the response, not children

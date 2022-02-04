---
layout: layout.njk
title: </> htmx - hx-preserve
---

## `hx-preserve`

The `hx-preserve` attribute allows you to keep a section of content unchanged between HTML replacement.  When hx-preserve 
is set to `true`, an element is preserved (by id) even if the surrounding HTML is updated by htmx.  An element *must* 
have an `id` to be preserved properly.

Note that some elements cannot unfortunately be preserved properly, such as iframes or certain types
of videos.  In these cases we recommend the [morphdom extension](/extensions/morphdom-swap/), which does a more elaborate DOM
reconciliation.

### Notes

* `hx-preserve` is not inherited

---
title: "Infinite Scroll"
description: Load content when you scroll to bottom
icon: "icon-[mdi--arrow-expand-down]"
---
The infinite scroll pattern provides a way to load content dynamically on user scrolling action.

Let's focus on the final row (or the last element of your content):

```html
<tr hx-get="/contacts/?page=2"
    hx-trigger="revealed"
    hx-swap="afterend">
  <td>Agent Smith</td>
  <td>void29@null.org</td>
  <td>55F49448C0</td>
</tr>
```

This last element contains a listener which, when scrolled into view, will trigger a request. The result is then appended after it.
The last element of the results will itself contain the listener to load the *next* page of results, and so on.

> `revealed` - triggered when an element is scrolled into the viewport (also useful for lazy-loading). If you are using `overflow` in css like `overflow-y: scroll` you should use `intersect once` instead of `revealed`.

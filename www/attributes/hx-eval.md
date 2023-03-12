---
layout: layout.njk
title: </> htmx - hx-eval
---

## `hx-eval`

The `hx-eval` attribute will cause an element to execute a client-side script.

In the context of the attribute, `this` refers to the element the attribute is placed on.

```html
  <div hx-eval="this.innerText='Clicked'">Click me!</div>
```


### Notes

* `hx-eval` is not inherited.

* You can control when the script executes with `hx-trigger`.

* `hx-eval` cannot be used in conjunction with an AJAX request.


---
layout: layout.njk
title: </> htmx - hx-inherit
---

## `hx-inherit`

The `hx-inherit` attribute allows you to control the automatic attribute inheritance of an element to its 
children nodes. One use case here is, to allow wrapping the whole page in `hx-boost`, while not having 
the configuration of that wrapper affect a more elaborated child node htmx configuration.

The default behavior for htmx is to inherit all attributes automatically. 
`hx-inherit` *disables* inheritance.


htmx evaluates inheritance as follows:

* when `hx-boost` is not set
  * get all elements that defines a `hx-<verb>` (`hx-get`, `hx-post`, `hx-patch`, `hx-put` or `hx-delete`)
  * for each htmx attribute, either find the htmx attribute on the element the `hx-<verb>` was defined on or traverse up all the parent nodes
  * the first element's value the corresponding htmx attribute has been found on is then used
* when `hx-boost` is set
  * make all `<a>` tags a `hx-get` with the link defined in the `href` attribute - [details](/attributes/hx-boost) which links hx-boost handles
  * then, same htmx attribute lookup procedure as above
* when `hx-inherit` is set on a parent node
  * when a parent node has a matching htmx attribute during the automatic lookup outlined above
  * `hx-inherit="false"` disable all attribute inheritance
  * `hx-inherit="hx-select hx-get hx-target"` disable inheritance for only one or multiple specified attributes


```html
<div hx-boost="true" hx-select="#content" hx-target="#content" hx-inherit="false">
  <a href="/page1">Go To Page 1</a> <!-- boosted with the attribute settings above -->
  <a href="/page2" hx-boost="unset">Go To Page 1</a> <!-- not boosted -->
  <button hx-get="/test" hx-target="this"></button> <!-- hx-select is not inherited -->
</div>
```

```html
<div hx-boost="true" hx-select="#content" hx-target="#content" hx-inherit="hx-target">
  <!-- hx-select is automatically set to parent's value; hx-target is not inherited -->
  <button hx-get="/test"></button>
</div>
```

```html
<div hx-target="#content">
  <div hx-boost="true" hx-select="#content" hx-inherit="hx-target">
    <!-- hx-select is automatically set to parent's value -->
    <!-- hx-target is inherited, because the direct parent does
    not specify hx-target, thus cannot disable inheritance -->
    <button hx-get="/test"></button>
  </div>
</div>
```

### Notes

* `hx-inherit="false"` or `hx-inherit="hx-boost"` does not disable `hx-boost`; instead use `hx-boost="unset"` to disable inheritance
* `hx-inherit="false"` or `hx-inherit="<attribute"` only affects the inheritance outcome, if the element also has the htmx attribute 
defined that is currently being looked up
* Find out more about [Attribute Inheritance](/docs/#inheritance)
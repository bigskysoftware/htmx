---
layout: layout.njk
title: </> kutty - kt-classes
---

## `kt-classes`

The `kt-classes` attribute allows you to specify CSS classes that will be swapped onto the element that
the attribute is on.  This allows you to apply [CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
to your HTML without resorting to javascript.

A `kt-classes` attribute value consists of "runs", which are separated by an `&` character.  All
class operations within a given run will be applied sequentially, with the delay specified.

Within a run, a `,` character separates distinct class operations.

A class operation is an operation name `add`, `remove`, or `toggle`, followed by a CSS class name,
optionally followed by a colon `:` and a time delay.

Here are some examples:

```html
<div kt-classes="add foo"/> <!-- adds the class "foo" after 100ms -->
<div kt-classes="remove bar:1s"/> <!-- removes the class "bar" after 1s -->
<div kt-classes="remove bar:1s, add foo:1s"/> <!-- removes the class "bar" after 1s
                                               then adds the class "foo" 1s after that -->
<div kt-classes="remove bar:1s & add foo:1s"/> <!-- removes the class "bar" and adds 
                                                    class "foo" after 1s  -->
<div kt-classes="toggle foo:1s"/> <!-- toggles the class "foo" every 1s -->
```

### Notes

* The default delay if none is specified is 100ms

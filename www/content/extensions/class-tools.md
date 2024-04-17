+++
title = "class-tools"
+++

The `class-tools` extension  allows you to specify CSS classes that will be swapped onto or off of the elements by using
a `classes` or `data-classes` attribute.  This functionality allows you to apply
[CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
to your HTML without resorting to javascript.

A `classes` attribute value consists of "runs", which are separated by an `&` character.  All
class operations within a given run will be applied sequentially, with the delay specified.

Within a run, a `,` character separates distinct class operations.

A class operation is an operation name `add`, `remove`, or `toggle`, followed by a CSS class name,
optionally followed by a colon `:` and a time delay.

## Install

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/ext/class-tools.js"></script>
```

## Usage

```html
<div hx-ext="class-tools">
    <div classes="add foo"/> <!-- adds the class "foo" after 100ms -->
    <div class="bar" classes="remove bar:1s"/> <!-- removes the class "bar" after 1s -->
    <div class="bar" classes="remove bar:1s, add foo:1s"/> <!-- removes the class "bar" after 1s
                                                                then adds the class "foo" 1s after that -->
    <div class="bar" classes="remove bar:1s & add foo:1s"/> <!-- removes the class "bar" and adds
                                                                 class "foo" after 1s  -->
    <div classes="toggle foo:1s"/> <!-- toggles the class "foo" every 1s -->
</div>
```
